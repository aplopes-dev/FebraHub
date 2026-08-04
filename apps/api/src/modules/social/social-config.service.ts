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
    return {
      temChave: !!linha.chaveZernio,
      /** Os 4 últimos caracteres — identifica a chave sem entregá-la. */
      finalChave: linha.chaveZernio ? decifrar(this.config, linha.chaveZernio).slice(-4) : null,
      perfilZernio: linha.perfilZernio,
      contaAnuncio: linha.contaAnuncio,
      fuso: linha.fuso,
      atualizadoEm: linha.atualizadoEm,
    };
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

  /** A chave em claro. Só o cliente HTTP chama — nada mais. */
  async chave(): Promise<string | null> {
    const linha = await this.linha();
    return linha.chaveZernio ? decifrar(this.config, linha.chaveZernio) : null;
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
