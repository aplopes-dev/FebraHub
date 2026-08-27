import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { cifrar, decifrar } from '../agentes/agentes.service';

/**
 * A CHAVE DO ZERNIO — onde ela mora e por quê.
 *
 * No banco, cifrada com a mesma chave dos tokens de agentes, e não em variável
 * de ambiente. Duas razões concretas:
 *
 *  1. quem troca a chave é a diretoria, pela tela. Variável de ambiente
 *     exigiria um deploy a cada rotação — e chave de integração rotaciona bem
 *     mais do que o sistema é implantado;
 *  2. a chave dá acesso de PUBLICAÇÃO às contas oficiais da Febracis. Deixá-la
 *     no `.env` a espalharia por backup, log de build e histórico de shell.
 *
 * Ela nunca sai daqui em texto claro: a tela recebe apenas `temChave` e os
 * últimos caracteres, o suficiente para conferir QUAL chave está gravada sem
 * revelar nenhuma delas.
 */
@Injectable()
export class SocialConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async configuracao() {
    const linha = await this.linha();
    // A chave pode existir no banco mas ter sido cifrada com OUTRA
    // AGENTES_CHAVE_CIFRA (rotação da chave, ou banco restaurado de outro
    // ambiente — ex.: dump de produção). Nesse caso `decifrar` lança
    // "Unsupported state or unable to authenticate data". Isso NÃO pode
    // derrubar a tela inteira com 500: degrada para "precisa reconfigurar",
    // e o painel mostra o estado sem-chave (a diretoria digita de novo).
    const legivel = this.chaveLegivel(linha.chaveZernio);
    return {
      temChave: !!legivel,
      /** A chave existe mas não abre com a chave de cifra atual. */
      chaveIlegivel: !!linha.chaveZernio && !legivel,
      /** Os 4 últimos caracteres — identifica a chave sem entregá-la. */
      finalChave: legivel ? legivel.slice(-4) : null,
      perfilZernio: linha.perfilZernio,
      contaAnuncio: linha.contaAnuncio,
      fuso: linha.fuso,
      atualizadoEm: linha.atualizadoEm,
    };
  }

  /** Decifra sem estourar: devolve null quando o texto cifrado não abre com a
   *  AGENTES_CHAVE_CIFRA atual (chave rotacionada, banco restaurado de outro
   *  ambiente…). O chamador trata como "sem chave utilizável". */
  private chaveLegivel(cifrado: string | null): string | null {
    if (!cifrado) return null;
    try {
      return decifrar(this.config, cifrado);
    } catch {
      return null;
    }
  }

  /** `chaveZernio: null` desliga a integração. Ausente = não mexe na chave. */
  async salvar(
    dados: {
      chaveZernio?: string | null;
      perfilZernio?: string | null;
      contaAnuncio?: string | null;
      fuso?: string;
    },
    autorId: string,
  ) {
    if (dados.chaveZernio !== undefined && dados.chaveZernio !== null) {
      const chave = dados.chaveZernio.trim();
      // Só a FORMA, nunca a validade: quem valida é o Zernio no primeiro uso, e
      // o botão "Testar conexão" da tela existe justamente para isso.
      if (!/^sk_[A-Za-z0-9_-]{20,}$/.test(chave)) {
        throw new BadRequestException({
          codigo: 'CHAVE_INVALIDA',
          message: 'A chave do Zernio começa com "sk_" e tem mais de 20 caracteres.',
        });
      }
    }
    const cifrada =
      dados.chaveZernio === undefined
        ? undefined
        : dados.chaveZernio
          ? cifrar(this.config, dados.chaveZernio.trim())
          : null;

    await this.prisma.socialConfig.upsert({
      where: { id: 'social' },
      create: {
        id: 'social',
        chaveZernio: cifrada ?? null,
        perfilZernio: dados.perfilZernio ?? null,
        contaAnuncio: dados.contaAnuncio ?? null,
        ...(dados.fuso ? { fuso: dados.fuso } : {}),
        atualizadoPor: autorId,
      },
      update: {
        ...(cifrada !== undefined ? { chaveZernio: cifrada } : {}),
        ...(dados.perfilZernio !== undefined ? { perfilZernio: dados.perfilZernio } : {}),
        ...(dados.contaAnuncio !== undefined ? { contaAnuncio: dados.contaAnuncio } : {}),
        ...(dados.fuso ? { fuso: dados.fuso } : {}),
        atualizadoPor: autorId,
      },
    });
    return this.configuracao();
  }

  /** A chave em claro. Só o cliente HTTP chama — nada mais. Se o texto cifrado
   *  não abre com a chave de cifra atual, devolve null (o cliente HTTP trata
   *  como SEM_CHAVE — 503 legível — em vez de propagar um erro de crypto que
   *  vira 500 e trava o painel). */
  async chave(): Promise<string | null> {
    const linha = await this.linha();
    return this.chaveLegivel(linha.chaveZernio);
  }

  async preferencias(): Promise<{ perfilZernio: string | null; contaAnuncio: string | null; fuso: string }> {
    const linha = await this.linha();
    return { perfilZernio: linha.perfilZernio, contaAnuncio: linha.contaAnuncio, fuso: linha.fuso };
  }

  private async linha() {
    const achada = await this.prisma.socialConfig.findUnique({ where: { id: 'social' } });
    if (achada) return achada;
    return this.prisma.socialConfig.create({ data: { id: 'social' } });
  }
}
