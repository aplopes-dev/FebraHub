/**
 * Metas do Hub Executivo.
 *
 * Duas origens, uma regra de precedência:
 *   1. meta_indicador — cadastrada no próprio painel (qualquer indicador);
 *   2. fato_loja_meta_mes — a planilha oficial da loja (só receita_loja).
 * Cadastro ganha da planilha: se a diretoria definir outra meta para a loja
 * pelo painel, é ela que vale — a planilha continua visível como referência
 * (níveis mínima/básica/máster) na tela analítica.
 *
 * Toda escrita deixa trilha em auditoria_acesso com o valor anterior e o
 * novo (spec §33; docs/DIVIDAS.md §9 pedia meta "com histórico de quem mudou
 * o quê e quando").
 */
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { podeVer } from '../../common/guards/setor.guard';
import { INDICADORES, indicadorPorCodigo, NOME_SETOR } from './indicadores';
import type { MetaDoCard, MetaLinha } from './executivo.types';

export interface MetasDoMes {
  /** Meta resolvida (cadastro > planilha) por código de indicador. */
  porIndicador: Map<string, MetaDoCard>;
}

@Injectable()
export class MetasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Metas de todos os indicadores para um mês, com a precedência aplicada. */
  async doMes(mes: string): Promise<MetasDoMes> {
    const [cadastradas, loja] = await Promise.all([
      this.prisma.metaIndicador.findMany({
        where: { escopo: 'mes', competencia: new Date(`${mes}T00:00:00Z`) },
      }),
      this.prisma.fatoLojaMetaMes.findUnique({ where: { mesRef: new Date(`${mes}T00:00:00Z`) } }),
    ]);

    const porIndicador = new Map<string, MetaDoCard>();
    if (loja) {
      const niveis = {
        minima: loja.minima ? Number(loja.minima) : null,
        basica: loja.basica ? Number(loja.basica) : null,
        master: loja.master ? Number(loja.master) : null,
      };
      // A meta "do card" é o nível básico — o alvo de operação da loja; os
      // três níveis vão juntos para a tela analítica mostrar a escada.
      const alvo = niveis.basica ?? niveis.minima ?? niveis.master;
      if (alvo != null) porIndicador.set('receita_loja', { valor: alvo, origem: 'loja', niveis });
    }
    for (const m of cadastradas) {
      const atual = porIndicador.get(m.indicador);
      porIndicador.set(m.indicador, {
        valor: Number(m.valor),
        origem: 'cadastro',
        // Preserva a escada da planilha como contexto mesmo com override.
        niveis: atual?.origem === 'loja' ? atual.niveis : undefined,
      });
    }
    return { porIndicador };
  }

  /** Meta anual explícita (escopo 'ano'); sem soma de mensais — parcial engana. */
  async doAno(indicador: string, ano: number): Promise<number | null> {
    const linha = await this.prisma.metaIndicador.findUnique({
      where: {
        indicador_escopo_competencia: {
          indicador,
          escopo: 'ano',
          competencia: new Date(`${ano}-01-01T00:00:00Z`),
        },
      },
    });
    return linha ? Number(linha.valor) : null;
  }

  /**
   * Tela de metas: uma linha por indicador que aceita meta, no período pedido,
   * com o valor vigente (e a origem dele).
   */
  async listar(usuario: UsuarioLogado, mes: string): Promise<MetaLinha[]> {
    const { porIndicador } = await this.doMes(mes);
    const anuais = await this.prisma.metaIndicador.findMany({
      where: { escopo: 'ano', competencia: new Date(`${mes.slice(0, 4)}-01-01T00:00:00Z`) },
    });
    const anualPor = new Map(anuais.map((m) => [m.indicador, m]));
    const mensais = await this.prisma.metaIndicador.findMany({
      where: { escopo: 'mes', competencia: new Date(`${mes}T00:00:00Z`) },
    });
    const obsPor = new Map(mensais.map((m) => [m.indicador, m.observacao]));

    const linhas: MetaLinha[] = [];
    for (const d of INDICADORES) {
      if (d.metaFonte == null) continue;
      if (!podeVer(usuario, [d.setor])) continue;
      const vigente = porIndicador.get(d.codigo) ?? null;
      linhas.push({
        indicador: d.codigo,
        nome: d.nome,
        setor: d.setor,
        setorNome: NOME_SETOR[d.setor] ?? d.setor,
        unidade: d.unidade,
        metaFonte: d.metaFonte,
        escopo: 'mes',
        competencia: mes,
        valor: vigente?.valor ?? null,
        origem: vigente?.origem ?? null,
        observacao: obsPor.get(d.codigo) ?? null,
      });
      const anual = anualPor.get(d.codigo);
      if (anual) {
        linhas.push({
          indicador: d.codigo,
          nome: d.nome,
          setor: d.setor,
          setorNome: NOME_SETOR[d.setor] ?? d.setor,
          unidade: d.unidade,
          metaFonte: d.metaFonte,
          escopo: 'ano',
          competencia: `${mes.slice(0, 4)}-01-01`,
          valor: Number(anual.valor),
          origem: 'cadastro',
          observacao: anual.observacao,
        });
      }
    }
    return linhas;
  }

  /**
   * Define (upsert) ou remove (valor null) a meta de um período.
   * admin define qualquer uma; gestor, só as do próprio setor.
   */
  async definir(
    usuario: UsuarioLogado,
    entrada: {
      indicador: string;
      escopo: 'mes' | 'ano';
      competencia: string;
      valor: number | null;
      observacao?: string | null;
    },
    ip?: string,
  ): Promise<void> {
    const def = indicadorPorCodigo(entrada.indicador);
    if (!def || def.metaFonte == null) {
      throw new BadRequestException({
        codigo: 'INDICADOR_INVALIDO',
        message: 'Indicador desconhecido ou que não aceita meta',
      });
    }
    const gestorDoSetor = usuario.papel === 'gestor' && podeVer(usuario, [def.setor]);
    if (usuario.papel !== 'admin' && !gestorDoSetor) {
      throw new ForbiddenException({
        codigo: 'SETOR_NEGADO',
        message: 'Só admin ou gestor do setor define metas deste indicador',
      });
    }
    if (!/^\d{4}-\d{2}-01$/.test(entrada.competencia)) {
      throw new BadRequestException({
        codigo: 'COMPETENCIA_INVALIDA',
        message: 'Competência deve ser o dia 1º do período (YYYY-MM-01)',
      });
    }
    if (entrada.escopo === 'ano' && !entrada.competencia.endsWith('-01-01')) {
      throw new BadRequestException({
        codigo: 'COMPETENCIA_INVALIDA',
        message: 'Meta anual usa a competência 01/01 do ano',
      });
    }
    if (entrada.valor != null && (!Number.isFinite(entrada.valor) || entrada.valor < 0)) {
      throw new BadRequestException({ codigo: 'VALOR_INVALIDO', message: 'Valor de meta inválido' });
    }

    const chave = {
      indicador: entrada.indicador,
      escopo: entrada.escopo,
      competencia: new Date(`${entrada.competencia}T00:00:00Z`),
    };
    const anterior = await this.prisma.metaIndicador.findUnique({
      where: { indicador_escopo_competencia: chave },
    });

    if (entrada.valor == null) {
      if (anterior) await this.prisma.metaIndicador.delete({ where: { id: anterior.id } });
    } else {
      await this.prisma.metaIndicador.upsert({
        where: { indicador_escopo_competencia: chave },
        create: {
          ...chave,
          valor: new Prisma.Decimal(entrada.valor),
          observacao: entrada.observacao ?? null,
          criadoPor: usuario.id,
        },
        update: {
          valor: new Prisma.Decimal(entrada.valor),
          observacao: entrada.observacao ?? null,
          atualizadoEm: new Date(),
        },
      });
    }

    // Trilha com o antes e o depois — é ela que responde "quem mudou a meta?".
    await this.prisma.auditoriaAcesso
      .create({
        data: {
          usuarioId: usuario.id,
          acao: entrada.valor == null ? 'meta_removida' : 'meta_definida',
          recurso: `executivo/metas/${entrada.indicador}`,
          detalhe: {
            indicador: entrada.indicador,
            escopo: entrada.escopo,
            competencia: entrada.competencia,
            de: anterior ? Number(anterior.valor) : null,
            para: entrada.valor,
          },
          ip,
        },
      })
      .catch(() => undefined);
  }
}
