import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RemoverDto, StatusIntegracaoDto } from './dto/ingest.dto';

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

/** Tabelas da Loja com coluna origem_dado: CRUD marca 'cadastro' e o sync
 *  não sobrescreve nem apaga essas linhas (cadastro > planilha). */
const TABELAS_ORIGEM_DADO = new Set([
  'fato_loja_curso',
  'fato_loja_receita_extra',
  'fato_loja_fechamento',
  'fato_loja_meta_mes',
  'fato_loja_meta_curso',
]);

/**
 * Teto do recorte de data do `remover`. A trava de 120 dias do
 * salesforce_email_sync.py continua lá, mas ela roda no cliente: quem tem o
 * token pode chamar a rota direto. Um ano é folgado para qualquer carga
 * incremental e ainda assim impede "apaga tudo" por engano.
 */
const JANELA_MAX_DIAS = 366;

/** Envolve um identificador vindo de fora — o nome já passou pela lista de permissão. */
const ident = (s: string) => Prisma.raw(`"${s.replace(/"/g, '""')}"`);

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

    // As colunas são a união do que veio, mas só as graváveis de verdade na
    // tabela — o PostgREST rejeitava coluna desconhecida e o ETL nem percebia.
    const { gravaveis, geradas, tipos } = await this.colunasDe(tabela);
    const enviadas = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
    const colunas = enviadas.filter((c) => gravaveis.has(c));
    const ignoradas = enviadas.filter((c) => !gravaveis.has(c));
    if (!colunas.length) {
      throw new BadRequestException({
        codigo: 'SEM_COLUNA_VALIDA',
        message: 'Nenhuma das colunas enviadas existe na tabela',
      });
    }
    // Coluna GENERATED não pode ser escrita — o Postgres recusa qualquer valor
    // que não seja DEFAULT. É o caso de fato_meta_insights.anuncio_key, que faz
    // parte da PK mas é derivada: exigir que o ETL a mande quebraria a carga.
    const faltando = chaves.filter((c) => !colunas.includes(c) && !geradas.has(c));
    if (faltando.length) {
      throw new BadRequestException({
        codigo: 'CHAVE_AUSENTE',
        message: `As colunas de conflito precisam vir nos dados: ${faltando.join(',')}`,
      });
    }

    // ETL nunca mexe em origem_dado — se mandar, ignoramos (default planilha
    // no INSERT; UPDATE em linha de cadastro fica bloqueado pelo WHERE).
    const colunasSemOrigem = colunas.filter((c) => c !== 'origem_dado');
    const listaCols = Prisma.join(colunasSemOrigem.map(ident), ', ');
    const listaConf = Prisma.join(chaves.map(ident), ', ');
    const atualiza = colunasSemOrigem.filter((c) => !chaves.includes(c));
    const protegeCadastro = TABELAS_ORIGEM_DADO.has(tabela) && gravaveis.has('origem_dado');

    // Uma transação para o lote inteiro: meia carga é pior do que carga
    // nenhuma, porque some sem ninguém perceber.
    const gravadas = await this.prisma.$transaction(async (tx) => {
      let n = 0;
      for (const linha of linhas) {
        // O cast por coluna existe porque o Prisma envia todo parâmetro string
        // como `text`, e o Postgres NÃO converte text -> timestamptz/date/
        // numeric implicitamente em prepared statement (erro 42804). O tipo
        // vem do catálogo, nunca do cliente, então pode entrar como raw.
        const valores = Prisma.join(
          colunasSemOrigem.map((c) => {
            const bruto = linha[c] ?? null;
            // jsonb precisa chegar como string JSON, não como objeto JS.
            const v =
              bruto !== null && typeof bruto === 'object' ? JSON.stringify(bruto) : bruto;
            const tipo = tipos.get(c);
            return tipo
              ? Prisma.sql`${v}::${Prisma.raw(tipo)}`
              : Prisma.sql`${v}`;
          }),
          ', ',
        );
        let set: Prisma.Sql;
        if (!atualiza.length) {
          set = Prisma.sql`DO NOTHING`;
        } else if (protegeCadastro) {
          set = Prisma.sql`DO UPDATE SET ${Prisma.join(
            atualiza.map((c) => Prisma.sql`${ident(c)} = EXCLUDED.${ident(c)}`),
            ', ',
          )} WHERE public.${ident(tabela)}.origem_dado IS DISTINCT FROM 'cadastro'`;
        } else {
          set = Prisma.sql`DO UPDATE SET ${Prisma.join(
            atualiza.map((c) => Prisma.sql`${ident(c)} = EXCLUDED.${ident(c)}`),
            ', ',
          )}`;
        }
        n += await tx.$executeRaw`
          INSERT INTO public.${ident(tabela)} (${listaCols})
          VALUES (${valores})
          ON CONFLICT (${listaConf}) ${set}
        `;
      }
      return n;
    });

    if (ignoradas.length) {
      this.logger.warn(
        `${tabela}: colunas ignoradas (não existem ou são geradas) — ${ignoradas.join(', ')}`,
      );
    }
    return { gravadas, colunas_ignoradas: ignoradas };
  }

  /**
   * Apaga, dentro do recorte de data, tudo cuja chave NÃO veio em `valores`.
   *
   * É a segunda metade da carga incremental: primeiro o ETL faz upsert de tudo
   * que leu na origem, depois chama aqui com as chaves que leu. O que estiver
   * no banco dentro da janela e não estiver na lista é registro que deixou de
   * existir na origem. Nessa ordem, uma falha no upsert não apaga nada.
   */
  async remover(tabela: string, dto: RemoverDto) {
    const permitidas = TABELAS_INGESTAO[tabela];
    if (!permitidas) {
      throw new BadRequestException({
        codigo: 'TABELA_NAO_PERMITIDA',
        message: `Tabela '${tabela}' não está aberta à ingestão`,
      });
    }
    // A chave tem que ser a identidade declarada da tabela. Apagar por uma
    // coluna qualquer transformaria a rota num DELETE genérico.
    if (!permitidas.includes(dto.chave)) {
      throw new BadRequestException({
        codigo: 'CHAVE_INVALIDA',
        message: `Chave esperada para ${tabela}: ${permitidas.join(',')}`,
      });
    }

    const { colunas } = await this.colunasDe(tabela);
    if (!colunas.has(dto.janela.coluna)) {
      throw new BadRequestException({
        codigo: 'COLUNA_INVALIDA',
        message: `Coluna '${dto.janela.coluna}' não existe em ${tabela}`,
      });
    }

    const de = new Date(dto.janela.de);
    const ate = new Date(dto.janela.ate);
    if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime()) || de > ate) {
      throw new BadRequestException({
        codigo: 'JANELA_INVALIDA',
        message: 'A janela precisa de "de" <= "ate"',
      });
    }
    const dias = Math.round((ate.getTime() - de.getTime()) / 86_400_000);
    if (dias > JANELA_MAX_DIAS) {
      throw new BadRequestException({
        codigo: 'JANELA_GRANDE',
        message: `Janela de ${dias} dias passa do limite de ${JANELA_MAX_DIAS}`,
      });
    }

    // A lista vai como UM parâmetro jsonb, não como N placeholders: uma carga
    // de 120 dias tem dezenas de milhares de chaves e estouraria o limite de
    // parâmetros do protocolo estendido.
    const valores = JSON.stringify(dto.valores.map((v) => String(v)));
    const protegeCadastro =
      TABELAS_ORIGEM_DADO.has(tabela) && colunas.has('origem_dado');
    const removidas = protegeCadastro
      ? await this.prisma.$executeRaw`
          DELETE FROM public.${ident(tabela)}
           WHERE ${ident(dto.janela.coluna)} >= ${dto.janela.de}::date
             AND ${ident(dto.janela.coluna)} <= ${dto.janela.ate}::date
             AND origem_dado IS DISTINCT FROM 'cadastro'
             AND (${ident(dto.chave)})::text NOT IN (
                   SELECT v FROM jsonb_array_elements_text(${valores}::jsonb) AS v
                 )
        `
      : await this.prisma.$executeRaw`
          DELETE FROM public.${ident(tabela)}
           WHERE ${ident(dto.janela.coluna)} >= ${dto.janela.de}::date
             AND ${ident(dto.janela.coluna)} <= ${dto.janela.ate}::date
             AND (${ident(dto.chave)})::text NOT IN (
                   SELECT v FROM jsonb_array_elements_text(${valores}::jsonb) AS v
                 )
        `;
    this.logger.log(
      `${tabela}: ${removidas} removidas na janela ${dto.janela.de}..${dto.janela.ate}`,
    );
    return { removidas };
  }

  /**
   * Devolve o token OAuth guardado de uma integração (hoje só o Conta Azul).
   *
   * A API v2 do Conta Azul rotaciona o refresh_token a cada renovação: o ETL
   * precisa ler o atual, renovar e gravar o novo. Antes ele lia direto no
   * PostgREST com a service_role; agora lê por aqui, com o token de máquina.
   */
  async lerToken(integracao: string) {
    const linhas = await this.prisma.$queryRaw<
      {
        integracao: string;
        access_token: string | null;
        refresh_token: string | null;
        expira_em: Date | null;
        atualizado_em: Date | null;
      }[]
    >`
      SELECT integracao, access_token, refresh_token, expira_em, atualizado_em
        FROM public.integracao_tokens
       WHERE integracao = ${integracao}
    `;
    if (!linhas.length) {
      throw new NotFoundException({
        codigo: 'TOKEN_NAO_ENCONTRADO',
        message: `Sem token gravado para '${integracao}'`,
      });
    }
    return linhas[0];
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

  /**
   * Colunas reais da tabela, separando as GENERATED: elas existem para leitura
   * e para a PK, mas o INSERT não pode citá-las.
   */
  private async colunasDe(
    tabela: string,
  ): Promise<{
    colunas: Set<string>;
    gravaveis: Set<string>;
    geradas: Set<string>;
    tipos: Map<string, string>;
  }> {
    type Coluna = { column_name: string; is_generated: string; tipo: string };
    // format_type devolve o nome que o próprio Postgres aceita num cast
    // ("timestamp with time zone", "numeric", "text"), incluindo modificador.
    const linhas: Coluna[] = await this.prisma.$queryRaw<Coluna[]>`
      SELECT c.column_name,
             c.is_generated,
             format_type(a.atttypid, a.atttypmod) AS tipo
        FROM information_schema.columns c
        JOIN pg_attribute a
          ON a.attrelid = (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass
         AND a.attname = c.column_name
       WHERE c.table_schema = 'public' AND c.table_name = ${tabela}
    `;
    const colunas = new Set<string>(linhas.map((l: Coluna) => l.column_name));
    const geradas = new Set<string>(
      linhas.filter((l: Coluna) => l.is_generated === 'ALWAYS').map((l: Coluna) => l.column_name),
    );
    const gravaveis = new Set<string>([...colunas].filter((c) => !geradas.has(c)));
    const tipos = new Map<string, string>(linhas.map((l: Coluna) => [l.column_name, l.tipo]));
    return { colunas, gravaveis, geradas, tipos };
  }
}
