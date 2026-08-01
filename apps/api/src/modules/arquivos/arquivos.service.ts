import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../../database/prisma.service';
import { StorageService, ArquivoParaSubir } from '../storage/storage.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';

/**
 * Tipos aceitos. Lista de permissão, não de bloqueio: bloquear extensões
 * perigosas é uma corrida que se perde, permitir as necessárias não é.
 */
const MIMES_ACEITOS = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
]);

/** Formatos que não têm assinatura nos primeiros bytes — o file-type não os detecta. */
const SEM_ASSINATURA = new Set(['text/csv', 'text/plain']);

@Injectable()
export class ArquivosService {
  private readonly logger = new Logger(ArquivosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async enviar(
    arquivo: ArquivoParaSubir,
    extras: { pasta?: string; vinculoTipo?: string; vinculoId?: string },
    usuario: UsuarioLogado,
  ) {
    this.storage.validarTamanho(arquivo.conteudo.length);

    // O tipo vem dos BYTES, não do que o cliente declarou nem da extensão.
    // Um .png que na verdade é HTML vira XSS quando alguém abre o link.
    const detectado = await fileTypeFromBuffer(arquivo.conteudo);
    const declarado = (arquivo.mimeDeclarado || '').split(';')[0].trim();

    let mime: string;
    if (detectado) {
      mime = detectado.mime;
    } else if (SEM_ASSINATURA.has(declarado) && ehTextoPlano(arquivo.conteudo)) {
      // CSV e TXT não têm magic number; aceitamos só se o conteúdo for mesmo
      // texto, o que descarta binário disfarçado de .csv.
      mime = declarado;
    } else {
      throw new BadRequestException({
        codigo: 'TIPO_NAO_RECONHECIDO',
        message: 'Não foi possível identificar o tipo do arquivo',
      });
    }

    if (!MIMES_ACEITOS.has(mime)) {
      throw new BadRequestException({
        codigo: 'TIPO_NAO_PERMITIDO',
        message: `Tipo de arquivo não permitido (${mime})`,
      });
    }

    const pasta = extras.pasta ?? 'geral';
    const chave = this.storage.montarChave(pasta, arquivo.nomeOriginal);
    const { sha256 } = await this.storage.upload(chave, arquivo.conteudo, mime);

    const registro = await this.prisma.arquivo.create({
      data: {
        chave,
        nomeOriginal: arquivo.nomeOriginal.slice(0, 250),
        mime,
        tamanho: arquivo.conteudo.length,
        sha256,
        pasta,
        enviadoPor: usuario.id,
        vinculoTipo: extras.vinculoTipo ?? null,
        vinculoId: extras.vinculoId ?? null,
      },
    });

    await this.auditar(usuario.id, 'arquivo_enviado', `arquivo:${registro.id}`);
    return this.paraResposta(registro);
  }

  async listar(filtro: {
    pasta?: string;
    vinculoTipo?: string;
    vinculoId?: string;
    pagina: number;
    porPagina: number;
  }) {
    const where = {
      excluidoEm: null,
      ...(filtro.pasta ? { pasta: filtro.pasta } : {}),
      ...(filtro.vinculoTipo ? { vinculoTipo: filtro.vinculoTipo } : {}),
      ...(filtro.vinculoId ? { vinculoId: filtro.vinculoId } : {}),
    };
    const [total, itens] = await Promise.all([
      this.prisma.arquivo.count({ where }),
      this.prisma.arquivo.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
    ]);
    return {
      itens: itens.map((i) => this.paraResposta(i)),
      total,
      pagina: filtro.pagina,
      por_pagina: filtro.porPagina,
      paginas: Math.ceil(total / filtro.porPagina) || 1,
    };
  }

  async urlAssinada(id: string, segundos: number): Promise<string> {
    const a = await this.buscar(id);
    return this.storage.urlAssinada(a.chave, segundos, a.nomeOriginal);
  }

  async baixar(id: string) {
    const a = await this.buscar(id);
    const conteudo = await this.storage.baixar(a.chave);
    return { conteudo, mime: a.mime, nome: a.nomeOriginal };
  }

  async excluir(id: string, usuario: UsuarioLogado): Promise<void> {
    const a = await this.buscar(id);
    // Marca primeiro, apaga depois: se o MinIO falhar, o arquivo some da
    // listagem e o objeto órfão é limpo depois — o contrário deixaria um
    // registro apontando para um objeto que não existe mais.
    await this.prisma.arquivo.update({ where: { id }, data: { excluidoEm: new Date() } });
    try {
      await this.storage.excluir(a.chave);
    } catch (e) {
      this.logger.warn(`objeto ${a.chave} não pôde ser removido do MinIO: ${e}`);
    }
    await this.auditar(usuario.id, 'arquivo_excluido', `arquivo:${id}`);
  }

  private async buscar(id: string) {
    const a = await this.prisma.arquivo.findFirst({ where: { id, excluidoEm: null } });
    if (!a) {
      throw new NotFoundException({
        codigo: 'ARQUIVO_NAO_ENCONTRADO',
        message: 'Arquivo não encontrado',
      });
    }
    return a;
  }

  private paraResposta(a: {
    id: string;
    nomeOriginal: string;
    mime: string;
    tamanho: number;
    pasta: string;
    vinculoTipo: string | null;
    vinculoId: string | null;
    criadoEm: Date;
  }) {
    // A chave no MinIO não sai daqui: ela é o caminho interno do objeto e o
    // cliente não tem o que fazer com ela — o acesso é por URL assinada.
    return {
      id: a.id,
      nome: a.nomeOriginal,
      mime: a.mime,
      tamanho: a.tamanho,
      pasta: a.pasta,
      vinculo_tipo: a.vinculoTipo,
      vinculo_id: a.vinculoId,
      criado_em: a.criadoEm.toISOString(),
    };
  }

  private async auditar(usuarioId: string, acao: string, recurso: string) {
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId, acao, recurso } })
      .catch(() => undefined);
  }
}

/** Heurística simples: byte nulo ou excesso de controle não é texto. */
function ehTextoPlano(b: Buffer): boolean {
  const amostra = b.subarray(0, 4096);
  let suspeitos = 0;
  for (const byte of amostra) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) suspeitos++;
  }
  return suspeitos / Math.max(amostra.length, 1) < 0.05;
}
