import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StatusIntegracaoDto } from './dto/ingest.dto';

/**
 * Tabelas que os ETLs podem escrever, e por qual chave cada uma resolve
 * conflito. Lista de permissão: o nome da tabela vem de fora e vira
 * identificador na consulta, então nada que não esteja aqui é aceito.
 *
 * As chaves espelham os `on_conflict` que os scripts já usavam no PostgREST.
 */
const TABELAS_INGESTAO: Record<string, string[]> = {
  fato_liquidacao_cartao: ['parcela_id'],
  fato_extrato_cispay: ['lancamento_id'],
  fato_contas_receber: ['parcela_id'],
  fato_contas_pagar: ['parcela_id'],
  fato_meta_insights: ['data', 'campanha_id', 'anuncio_key'],
  fato_loja_cupom: ['cupom_id'],
  fato_loja_item: ['cupom_id', 'seq_item'],
  fato_loja_pagamento: ['cupom_id', 'seq_item'],
  fato_loja_estoque: ['produto_id'],
  fato_loja_curso: ['mes_ref', 'curso', 'turma', 'treinador'],
  fato_loja_receita_extra: ['fonte', 'chave_origem'],
  fato_loja_fechamento: ['mes_ref'],
  fato_loja_meta_mes: ['mes_ref'],
  fato_loja_meta_curso: ['mes_ref', 'curso'],
  fato_pagamento_base: ['pagamento_id'],
  fato_base_alunos: ['matricula_id'],
  fato_pedidos: ['pedido_id'],
  fato_participantes: ['participante_id'],
  fato_credenciamento: ['credenciamento_id'],
  dim_eventos: ['evento_id'],
  dim_alunos: ['aluno_id'],
  dim_leads: ['lead_id'],
  dim_cursos: ['curso_id'],
  dim_turmas: ['turma_id'],
  dim_consultores: ['consultor_id'],
  dim_origens: ['origem_id'],
  fato_negocio_lead: ['negocio_id'],
  integracao_tokens: ['integracao'],
};

const LOTE_MAX = 2000;

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsert(tabela: string, linhas: Record<string, unknown>[], conflito: string) {
    const permitidas = TABELAS_INGESTAO[tabela];
    if (!permitidas) {
      throw new BadRequestException({
        codigo: 'TABELA_NAO_PERMITIDA',
        message: `Tabela '${tabela}' não está aberta à ingestão`,
      });
    }
    if (!linhas?.length) return { gravadas: 0 };
    if (linhas.length > LOTE_MAX) {
      throw new BadRequestException({
        codigo: 'LOTE_GRANDE',
        message: `Máximo de ${LOTE_MAX} linhas por chamada`,
      });
    }

    const chaves = conflito.split(',').map((c) => c.trim()).filter(Boolean);
    const mesmaChave =
      chaves.length === permitidas.length && chaves.every((c) => permitidas.includes(c));
    if (!mesmaChave) {
      throw new BadRequestException({
        codigo: 'CONFLITO_INVALIDO',
        message: `Conflito esperado para ${tabela}: ${permitidas.join(',')}`,
      });
    }

    // As colunas são a união do que veio, mas só as que existem de verdade na
    // tabela — o PostgREST rejeitava coluna desconhecida e o ETL nem percebia.
    const colunasReais = await this.colunasDe(tabela);
    const enviadas = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
    const colunas = enviadas.filter((c) => colunasReais.has(c));
    const ignoradas = enviadas.filter((c) => !colunasReais.has(c));
    if (!colunas.length) {
      throw new BadRequestException({
        codigo: 'SEM_COLUNA_VALIDA',
        message: 'Nenhuma das colunas enviadas existe na tabela',
      });
    }
    if (!chaves.every((c) => colunas.includes(c))) {
      throw new BadRequestException({
        codigo: 'CHAVE_AUSENTE',
        message: `As colunas de conflito precisam vir nos dados: ${chaves.join(',')}`,
      });
    }

    const ident = (s: string) => Prisma.raw(`"${s.replace(/"/g, '""')}"`);
    const listaCols = Prisma.join(colunas.map(ident), ', ');
    const listaConf = Prisma.join(chaves.map(ident), ', ');
    const atualiza = colunas.filter((c) => !chaves.includes(c));

    // Uma transação para o lote inteiro: meia carga é pior do que carga
    // nenhuma, porque some sem ninguém perceber.
    const gravadas = await this.prisma.$transaction(async (tx) => {
      let n = 0;
      for (const linha of linhas) {
        const valores = Prisma.join(colunas.map((c) => Prisma.sql`${linha[c] ?? null}`), ', ');
        const set = atualiza.length
          ? Prisma.sql`DO UPDATE SET ${Prisma.join(
              atualiza.map((c) => Prisma.sql`${ident(c)} = EXCLUDED.${ident(c)}`),
              ', ',
            )}`
          : Prisma.sql`DO NOTHING`;
        n += await tx.$executeRaw`
          INSERT INTO public.${ident(tabela)} (${listaCols})
          VALUES (${valores})
          ON CONFLICT (${listaConf}) ${set}
        `;
      }
      return n;
    });

    if (ignoradas.length) {
      this.logger.warn(`${tabela}: colunas ignoradas (não existem) — ${ignoradas.join(', ')}`);
    }
    return { gravadas, colunas_ignoradas: ignoradas };
  }

  async registrarStatus(dto: StatusIntegracaoDto) {
    const agora = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.integracao_status
        (fonte, nome_exibicao, ultima_sync, registros, status, mensagem, duracao_segundos, atualizado_em)
      VALUES (${dto.fonte}, ${dto.nome_exibicao ?? dto.fonte}, ${agora}, ${dto.registros ?? null},
              ${dto.status}, ${dto.mensagem ?? null}, ${dto.duracao_segundos ?? null}, ${agora})
      ON CONFLICT (fonte) DO UPDATE SET
        nome_exibicao = EXCLUDED.nome_exibicao,
        ultima_sync = EXCLUDED.ultima_sync,
        registros = EXCLUDED.registros,
        status = EXCLUDED.status,
        mensagem = EXCLUDED.mensagem,
        duracao_segundos = EXCLUDED.duracao_segundos,
        atualizado_em = EXCLUDED.atualizado_em
    `;
    return { fonte: dto.fonte, status: dto.status };
  }

  private async colunasDe(tabela: string): Promise<Set<string>> {
    const linhas = await this.prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ${tabela}
    `;
    return new Set(linhas.map((l) => l.column_name));
  }
}
