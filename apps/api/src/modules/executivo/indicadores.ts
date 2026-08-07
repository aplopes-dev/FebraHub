/**
 * Catálogo de indicadores do Hub Executivo — a fonte ÚNICA das fórmulas.
 *
 * Mesmo papel do catalogo.ts do módulo de dados: fronteira de segurança e de
 * verdade. Nenhum SQL do hub nasce fora daqui; nenhum código de indicador
 * vindo do cliente vira consulta sem passar por esta lista; e a fórmula que a
 * tela analítica exibe é o texto declarado aqui — não uma segunda versão
 * mantida à mão no front.
 *
 * Regras herdadas do projeto que este catálogo respeita (docs/DESCOBERTAS.md):
 *   - Receita de cursos, de eventos e da loja NUNCA se somam (§1). O painel
 *     mostra as três lado a lado; não existe indicador "receita total".
 *   - Receita de evento usa valor_liquido — o Sympla retém ~11,5% (§7).
 *   - Pagamento→curso liga por original_id_venda, nunca por aluno (§3).
 *   - Agregar ANTES de juntar: toda quebra agrega a fato antes do join (§10).
 *   - Conta Azul não se soma com Salesforce (sobreposição de receita) — ela
 *     entra como livro-caixa: inadimplência, a receber e recebido.
 *
 * Datas saem do SQL como TEXTO (to_char) e valores como float8: nada de
 * Decimal/Date atravessando a fronteira para o motor de cálculo.
 *
 * Placeholders: $1 = início (inclusive), $2 = fim (exclusive), sempre ::date.
 * Consultas de estado e de série mensal completa não têm parâmetros.
 */
import type { Setor } from '../dados/catalogo';
import type { Direcao } from './calculos';

export type Unidade = 'brl' | 'qtd' | 'pct' | 'nota';

export interface DimensaoIndicador {
  codigo: string;
  nome: string;
  /** $1/$2 = período; devolve rotulo(text), valor(float8), quantidade(int). */
  sql: string;
}

export interface ColunaDetalhe {
  chave: string;
  nome: string;
  tipo: 'texto' | 'brl' | 'qtd' | 'data' | 'pct';
}

export interface DetalheIndicador {
  colunas: ColunaDetalhe[];
  /** $1/$2 = período, $3 = limite, $4 = offset. */
  sql: string;
  /** $1/$2 = período; devolve total(int) e soma(float8|null). */
  sqlTotal: string;
}

export interface DefinicaoIndicador {
  codigo: string;
  nome: string;
  /** Rótulo curto do card. */
  curto: string;
  descricao: string;
  /** A fórmula em português, exibida na tela analítica (spec §22). */
  formula: string;
  setor: Setor;
  unidade: Unidade;
  direcao: Direcao;
  /** fluxo = soma no período · estado = fotografia do agora. */
  tipo: 'fluxo' | 'estado';
  /**
   * true = o valor mensal é uma razão/média (ticket, %, nota): comparações
   * valem, mas "esperado até hoje" e projeção por distribuição não fazem
   * sentido e ficam de fora.
   */
  razao?: boolean;
  fonte: {
    /** Chave normalizada de vw_integracao_status (frescor real da fonte). */
    integracao: string;
    rotulo: string;
    tabela: string;
  };
  /** De onde pode vir meta: cadastro próprio, planilha da loja, ou nenhuma. */
  metaFonte: 'cadastro' | 'loja' | null;
  /** Aviso fixo de cobertura (dívidas conhecidas que precisam aparecer). */
  cobertura?: string;
  /** Aparece na primeira dobra da visão geral. */
  naVisaoGeral: boolean;
  ordem: number;
  sql: {
    /** Série mensal completa: mes(text YYYY-MM-01), valor(float8). */
    serieMensal?: string;
    /** Série diária no intervalo: dia(text YYYY-MM-DD), valor(float8). */
    serieDiaria?: string;
    /** Estado: valor(float8), quantidade(int|null), referencia(text|null). */
    estadoAtual?: string;
    /** Até que dia a fonte tem dado: ate(text|null). */
    cobreAte: string;
  };
  dimensoes: DimensaoIndicador[];
  detalhe?: DetalheIndicador;
}

/* Fragmentos repetidos — declarados uma vez para a fórmula não divergir
   entre a série mensal, a diária e o detalhe do MESMO indicador. */

const PAGAMENTO_VALIDO = `data_pagamento IS NOT NULL
      AND (status_pagamento IS NULL OR status_pagamento NOT IN ('Negado', 'Cancelado'))`;

const CUPOM_VALIDO = `data_emissao IS NOT NULL
      AND NOT coalesce(cancelado, false) AND NOT coalesce(devolvido, false)`;

const VENCIDA_ABERTA = `(status = 'Vencido'
       OR (status = 'Parcial' AND data_vencimento < (now() AT TIME ZONE 'America/Bahia')::date))`;

export const INDICADORES: readonly DefinicaoIndicador[] = [
  /* ============================ FINANCEIRO ============================ */
  {
    codigo: 'receita_cursos',
    nome: 'Receita de cursos (pagamentos)',
    curto: 'Receita · cursos',
    descricao:
      'Pagamentos de curso registrados no Salesforce, pela data do pagamento. ' +
      'Não soma com eventos nem com a loja — unidades de negócio diferentes.',
    formula:
      'Soma de fato_pagamento_base.valor com data de pagamento no período, excluindo ' +
      'status "Negado" e "Cancelado". Pagamentos sem status entram (13% da base — ' +
      'dívida conhecida, exibida como cobertura).',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'salesforce', rotulo: 'Salesforce', tabela: 'fato_pagamento_base' },
    metaFonte: 'cadastro',
    cobertura: 'Inclui pagamentos sem status (≈13% da base); 85 pagamentos sem data ficam fora de qualquer mês.',
    naVisaoGeral: true,
    ordem: 10,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pagamento), 'YYYY-MM-DD') AS mes,
               sum(valor)::float8 AS valor
          FROM public.fato_pagamento_base
         WHERE ${PAGAMENTO_VALIDO}
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_pagamento, 'YYYY-MM-DD') AS dia, sum(valor)::float8 AS valor
          FROM public.fato_pagamento_base
         WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pagamento), 'YYYY-MM-DD') AS ate FROM public.fato_pagamento_base`,
    },
    dimensoes: [
      {
        codigo: 'curso',
        nome: 'Por curso',
        // Agrega ANTES de juntar (DESCOBERTAS §10) e liga pela venda (§3).
        sql: `
          WITH pagos AS (
            SELECT original_id_venda, sum(valor) AS valor, count(*) AS n
              FROM public.fato_pagamento_base
             WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date
             GROUP BY 1)
          SELECT coalesce(c.nome_curso, 'Sem curso vinculado') AS rotulo,
                 sum(p.valor)::float8 AS valor, sum(p.n)::int AS quantidade
            FROM pagos p
            LEFT JOIN public.mv_venda_curso v ON v.original_id_venda = p.original_id_venda
            LEFT JOIN public.dim_cursos c ON c.curso_id = v.curso_id
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
      {
        codigo: 'forma',
        nome: 'Por forma de pagamento',
        sql: `
          SELECT coalesce(forma_pagamento, 'Não informada') AS rotulo,
                 sum(valor)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_pagamento_base
           WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'status',
        nome: 'Por status',
        sql: `
          SELECT coalesce(nullif(status_pagamento, ''), 'Sem status') AS rotulo,
                 sum(valor)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_pagamento_base
           WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'consultor',
        nome: 'Por consultor(a)',
        sql: `
          WITH pagos AS (
            SELECT consultor_id, sum(valor) AS valor, count(*) AS n
              FROM public.fato_pagamento_base
             WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date
             GROUP BY 1)
          SELECT coalesce(c.nome, 'Sem consultor') AS rotulo,
                 sum(p.valor)::float8 AS valor, sum(p.n)::int AS quantidade
            FROM pagos p LEFT JOIN public.dim_consultores c ON c.consultor_id = p.consultor_id
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'data', nome: 'Data', tipo: 'data' },
        { chave: 'venda', nome: 'Venda', tipo: 'texto' },
        { chave: 'curso', nome: 'Curso', tipo: 'texto' },
        { chave: 'valor', nome: 'Valor', tipo: 'brl' },
        { chave: 'status', nome: 'Status', tipo: 'texto' },
        { chave: 'forma', nome: 'Forma', tipo: 'texto' },
      ],
      sql: `
        SELECT to_char(p.data_pagamento, 'YYYY-MM-DD') AS data,
               coalesce(p.nome_venda, p.original_id_venda, '—') AS venda,
               coalesce(c.nome_curso, '—') AS curso,
               p.valor::float8 AS valor,
               coalesce(nullif(p.status_pagamento, ''), 'Sem status') AS status,
               coalesce(p.forma_pagamento, '—') AS forma
          FROM public.fato_pagamento_base p
          LEFT JOIN public.mv_venda_curso v ON v.original_id_venda = p.original_id_venda
          LEFT JOIN public.dim_cursos c ON c.curso_id = v.curso_id
         WHERE ${PAGAMENTO_VALIDO} AND p.data_pagamento >= $1::date AND p.data_pagamento < $2::date
         ORDER BY p.data_pagamento DESC, p.valor DESC LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(valor)::float8 AS soma
          FROM public.fato_pagamento_base
         WHERE ${PAGAMENTO_VALIDO} AND data_pagamento >= $1::date AND data_pagamento < $2::date`,
    },
  },

  {
    codigo: 'despesas',
    nome: 'Despesas pagas',
    curto: 'Despesas',
    descricao:
      'Contas a pagar quitadas no período, pela data do pagamento (regime de caixa). ' +
      'A visão por competência está nas quebras.',
    formula:
      'Soma de fato_contas_pagar.valor_pago (ou valor, se o pago não veio) das parcelas ' +
      'com status "Pago", pela data de pagamento.',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'conta_azul', rotulo: 'Conta Azul', tabela: 'fato_contas_pagar' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 20,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pagamento), 'YYYY-MM-DD') AS mes,
               sum(coalesce(valor_pago, valor))::float8 AS valor
          FROM public.fato_contas_pagar
         WHERE status = 'Pago' AND data_pagamento IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_pagamento, 'YYYY-MM-DD') AS dia,
               sum(coalesce(valor_pago, valor))::float8 AS valor
          FROM public.fato_contas_pagar
         WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pagamento), 'YYYY-MM-DD') AS ate FROM public.fato_contas_pagar WHERE status = 'Pago'`,
    },
    dimensoes: [
      {
        codigo: 'categoria',
        nome: 'Por categoria',
        sql: `
          SELECT coalesce(categoria, 'Sem categoria') AS rotulo,
                 sum(coalesce(valor_pago, valor))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_pagar
           WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'fornecedor',
        nome: 'Por fornecedor',
        sql: `
          SELECT coalesce(fornecedor, 'Sem fornecedor') AS rotulo,
                 sum(coalesce(valor_pago, valor))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_pagar
           WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'centro_custo',
        nome: 'Por centro de custo',
        sql: `
          SELECT coalesce(centro_custo, 'Sem centro de custo') AS rotulo,
                 sum(coalesce(valor_pago, valor))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_pagar
           WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'competencia',
        nome: 'Por mês de competência',
        sql: `
          SELECT to_char(date_trunc('month', data_competencia), 'MM/YYYY') AS rotulo,
                 sum(coalesce(valor_pago, valor))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_pagar
           WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
             AND data_competencia IS NOT NULL
           GROUP BY date_trunc('month', data_competencia) ORDER BY date_trunc('month', data_competencia) DESC LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'data', nome: 'Pagamento', tipo: 'data' },
        { chave: 'fornecedor', nome: 'Fornecedor', tipo: 'texto' },
        { chave: 'descricao', nome: 'Descrição', tipo: 'texto' },
        { chave: 'categoria', nome: 'Categoria', tipo: 'texto' },
        { chave: 'valor', nome: 'Valor', tipo: 'brl' },
      ],
      sql: `
        SELECT to_char(data_pagamento, 'YYYY-MM-DD') AS data,
               coalesce(fornecedor, '—') AS fornecedor,
               coalesce(descricao, '—') AS descricao,
               coalesce(categoria, '—') AS categoria,
               coalesce(valor_pago, valor)::float8 AS valor
          FROM public.fato_contas_pagar
         WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date
         ORDER BY data_pagamento DESC, valor DESC NULLS LAST LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(coalesce(valor_pago, valor))::float8 AS soma
          FROM public.fato_contas_pagar
         WHERE status = 'Pago' AND data_pagamento >= $1::date AND data_pagamento < $2::date`,
    },
  },

  {
    codigo: 'inadimplencia',
    nome: 'Inadimplência (vencido em aberto)',
    curto: 'Inadimplência',
    descricao:
      'Parcelas a receber vencidas e não quitadas, pelo livro-caixa do Conta Azul — ' +
      'a única fonte do sistema com data de vencimento.',
    formula:
      'Soma de (valor − valor_pago) das parcelas de fato_contas_receber com status ' +
      '"Vencido", mais o saldo das "Parcial" já vencidas. Fotografia do agora, não fluxo do mês.',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'estado',
    fonte: { integracao: 'conta_azul', rotulo: 'Conta Azul', tabela: 'fato_contas_receber' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 30,
    sql: {
      estadoAtual: `
        SELECT sum(valor - coalesce(valor_pago, 0))::float8 AS valor,
               count(*)::int AS quantidade,
               to_char(max(sincronizado_em AT TIME ZONE 'America/Bahia'), 'YYYY-MM-DD') AS referencia
          FROM public.fato_contas_receber
         WHERE ${VENCIDA_ABERTA}`,
      cobreAte: `SELECT to_char(max(sincronizado_em AT TIME ZONE 'America/Bahia'), 'YYYY-MM-DD') AS ate FROM public.fato_contas_receber`,
    },
    dimensoes: [
      {
        codigo: 'faixa',
        nome: 'Por faixa de atraso',
        sql: `
          SELECT CASE
                   WHEN atraso <= 30 THEN '1 · até 30 dias'
                   WHEN atraso <= 90 THEN '2 · 31 a 90 dias'
                   WHEN atraso <= 180 THEN '3 · 91 a 180 dias'
                   ELSE '4 · acima de 180 dias'
                 END AS rotulo,
                 sum(aberto)::float8 AS valor, count(*)::int AS quantidade
            FROM (
              SELECT (now() AT TIME ZONE 'America/Bahia')::date - data_vencimento AS atraso,
                     valor - coalesce(valor_pago, 0) AS aberto
                FROM public.fato_contas_receber
               WHERE ${VENCIDA_ABERTA} AND data_vencimento IS NOT NULL) x
           GROUP BY 1 ORDER BY 1`,
      },
      {
        codigo: 'categoria',
        nome: 'Por categoria',
        sql: `
          SELECT coalesce(categoria, 'Sem categoria') AS rotulo,
                 sum(valor - coalesce(valor_pago, 0))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_receber
           WHERE ${VENCIDA_ABERTA}
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'cliente',
        nome: 'Maiores devedores',
        sql: `
          SELECT coalesce(cliente, 'Sem identificação') AS rotulo,
                 sum(valor - coalesce(valor_pago, 0))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_receber
           WHERE ${VENCIDA_ABERTA}
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'vencimento', nome: 'Vencimento', tipo: 'data' },
        { chave: 'cliente', nome: 'Cliente', tipo: 'texto' },
        { chave: 'descricao', nome: 'Descrição', tipo: 'texto' },
        { chave: 'aberto', nome: 'Em aberto', tipo: 'brl' },
        { chave: 'atraso', nome: 'Dias de atraso', tipo: 'qtd' },
      ],
      // Estado não recorta por período: a lista é o vencido em aberto de AGORA.
      sql: `
        SELECT to_char(data_vencimento, 'YYYY-MM-DD') AS vencimento,
               coalesce(cliente, '—') AS cliente,
               coalesce(descricao, '—') AS descricao,
               (valor - coalesce(valor_pago, 0))::float8 AS aberto,
               ((now() AT TIME ZONE 'America/Bahia')::date - data_vencimento)::int AS atraso
          FROM public.fato_contas_receber
         WHERE ${VENCIDA_ABERTA} AND ($1::date IS NOT NULL OR $2::date IS NOT NULL)
         ORDER BY aberto DESC LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(valor - coalesce(valor_pago, 0))::float8 AS soma
          FROM public.fato_contas_receber
         WHERE ${VENCIDA_ABERTA} AND ($1::date IS NOT NULL OR $2::date IS NOT NULL)`,
    },
  },

  {
    codigo: 'recebido_caixa',
    nome: 'Recebido no caixa (livro-caixa)',
    curto: 'Recebido · caixa',
    descricao:
      'Quanto entrou no caixa pelo livro do Conta Azul. NÃO se soma com a receita de ' +
      'cursos do Salesforce: as duas bases se sobrepõem (Maestria, IF e Coaching aparecem nas duas).',
    formula:
      'Soma de fato_contas_receber.valor_pago (ou valor) das parcelas "Recebido" e "Parcial", ' +
      'pela data de pagamento.',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'conta_azul', rotulo: 'Conta Azul', tabela: 'fato_contas_receber' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 40,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pagamento), 'YYYY-MM-DD') AS mes,
               sum(coalesce(valor_pago, valor))::float8 AS valor
          FROM public.fato_contas_receber
         WHERE status IN ('Recebido', 'Parcial') AND data_pagamento IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_pagamento, 'YYYY-MM-DD') AS dia,
               sum(coalesce(valor_pago, valor))::float8 AS valor
          FROM public.fato_contas_receber
         WHERE status IN ('Recebido', 'Parcial') AND data_pagamento >= $1::date AND data_pagamento < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pagamento), 'YYYY-MM-DD') AS ate FROM public.fato_contas_receber WHERE status IN ('Recebido', 'Parcial')`,
    },
    dimensoes: [
      {
        codigo: 'categoria',
        nome: 'Por categoria',
        sql: `
          SELECT coalesce(categoria, 'Sem categoria') AS rotulo,
                 sum(coalesce(valor_pago, valor))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_contas_receber
           WHERE status IN ('Recebido', 'Parcial') AND data_pagamento >= $1::date AND data_pagamento < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'a_receber_cartao',
    nome: 'A receber de cartão (CisPay)',
    curto: 'A receber · cartão',
    descricao:
      'Parcelas de cartão que a adquirente ainda vai depositar — fluxo de caixa futuro ' +
      'direto da CisPay, sem modelo e sem estatística.',
    formula:
      'Soma de fato_liquidacao_cartao.valor_liquido das parcelas tipo "Credit" com data de ' +
      'liquidação após hoje.',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'neutra',
    tipo: 'estado',
    fonte: { integracao: 'cispay', rotulo: 'CisPay', tabela: 'fato_liquidacao_cartao' },
    metaFonte: null,
    naVisaoGeral: true,
    ordem: 50,
    sql: {
      estadoAtual: `
        SELECT sum(valor_liquido)::float8 AS valor, count(*)::int AS quantidade, NULL::text AS referencia
          FROM public.fato_liquidacao_cartao
         WHERE tipo_transacao = 'Credit' AND data_liquidacao > (now() AT TIME ZONE 'America/Bahia')::date`,
      cobreAte: `SELECT to_char(max(data_venda), 'YYYY-MM-DD') AS ate FROM public.fato_liquidacao_cartao`,
    },
    dimensoes: [
      {
        codigo: 'horizonte',
        nome: 'Por horizonte',
        sql: `
          SELECT CASE
                   WHEN data_liquidacao <= (now() AT TIME ZONE 'America/Bahia')::date + 30 THEN '1 · até 30 dias'
                   WHEN data_liquidacao <= (now() AT TIME ZONE 'America/Bahia')::date + 60 THEN '2 · 31 a 60 dias'
                   WHEN data_liquidacao <= (now() AT TIME ZONE 'America/Bahia')::date + 90 THEN '3 · 61 a 90 dias'
                   ELSE '4 · além de 90 dias'
                 END AS rotulo,
                 sum(valor_liquido)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_liquidacao_cartao
           WHERE tipo_transacao = 'Credit' AND data_liquidacao > (now() AT TIME ZONE 'America/Bahia')::date
           GROUP BY 1 ORDER BY 1`,
      },
      {
        codigo: 'bandeira',
        nome: 'Por bandeira',
        sql: `
          SELECT coalesce(bandeira, 'Sem bandeira') AS rotulo,
                 sum(valor_liquido)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_liquidacao_cartao
           WHERE tipo_transacao = 'Credit' AND data_liquidacao > (now() AT TIME ZONE 'America/Bahia')::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'mdr_cartao',
    nome: 'Custo de maquininha (MDR efetivo)',
    curto: 'MDR · cartão',
    descricao:
      'Taxa efetiva cobrada pela adquirente sobre as vendas de cartão do mês — o único ' +
      'número do projeto conferido contra o extrato bancário (3,10%).',
    formula: '100 × taxa_cispay ÷ valor_bruto das parcelas "Credit", pelo mês da venda.',
    setor: 'financeiro',
    unidade: 'pct',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    razao: true,
    fonte: { integracao: 'cispay', rotulo: 'CisPay', tabela: 'fato_liquidacao_cartao' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 60,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_venda), 'YYYY-MM-DD') AS mes,
               (100.0 * sum(taxa_cispay) / nullif(sum(valor_bruto), 0))::float8 AS valor
          FROM public.fato_liquidacao_cartao
         WHERE tipo_transacao = 'Credit' AND data_venda IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_venda), 'YYYY-MM-DD') AS ate FROM public.fato_liquidacao_cartao`,
    },
    dimensoes: [
      {
        codigo: 'bandeira',
        nome: 'Por bandeira (R$ de taxa)',
        sql: `
          SELECT coalesce(bandeira, 'Sem bandeira') AS rotulo,
                 sum(taxa_cispay)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_liquidacao_cartao
           WHERE tipo_transacao = 'Credit' AND data_venda >= $1::date AND data_venda < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'perdas_cartao',
    nome: 'Perdas no cartão (estorno e chargeback)',
    curto: 'Perdas · cartão',
    descricao: 'Dinheiro devolvido ou contestado no cartão — perdas que nunca eram contabilizadas.',
    formula:
      'Valor absoluto da soma de valor_liquido das parcelas com tipo_transacao ≠ "Credit", ' +
      'pelo mês da liquidação.',
    setor: 'financeiro',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'cispay', rotulo: 'CisPay', tabela: 'fato_liquidacao_cartao' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 70,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_liquidacao), 'YYYY-MM-DD') AS mes,
               abs(sum(valor_liquido))::float8 AS valor
          FROM public.fato_liquidacao_cartao
         WHERE tipo_transacao <> 'Credit' AND data_liquidacao IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_liquidacao, 'YYYY-MM-DD') AS dia, abs(sum(valor_liquido))::float8 AS valor
          FROM public.fato_liquidacao_cartao
         WHERE tipo_transacao <> 'Credit' AND data_liquidacao >= $1::date AND data_liquidacao < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_liquidacao), 'YYYY-MM-DD') AS ate FROM public.fato_liquidacao_cartao`,
    },
    dimensoes: [
      {
        codigo: 'tipo',
        nome: 'Por tipo',
        sql: `
          SELECT tipo_transacao AS rotulo, abs(sum(valor_liquido))::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_liquidacao_cartao
           WHERE tipo_transacao <> 'Credit' AND data_liquidacao >= $1::date AND data_liquidacao < $2::date
           GROUP BY 1 ORDER BY 2 DESC`,
      },
    ],
  },

  /* ============================ COMERCIAL ============================ */
  {
    codigo: 'vendas_cursos',
    nome: 'Vendas de cursos (contratos)',
    curto: 'Vendas · cursos',
    descricao:
      'Valor dos contratos de matrícula fechados no período (o que foi VENDIDO). A receita ' +
      'de cursos, ao lado, é o que foi PAGO — os dois não caminham juntos no mesmo mês.',
    formula: 'Soma de fato_base_alunos.valor pela data da matrícula.',
    setor: 'comercial',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'salesforce', rotulo: 'Salesforce', tabela: 'fato_base_alunos' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 110,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_matricula), 'YYYY-MM-DD') AS mes,
               sum(valor)::float8 AS valor
          FROM public.fato_base_alunos
         WHERE data_matricula IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_matricula, 'YYYY-MM-DD') AS dia, sum(valor)::float8 AS valor
          FROM public.fato_base_alunos
         WHERE data_matricula >= $1::date AND data_matricula < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_matricula), 'YYYY-MM-DD') AS ate FROM public.fato_base_alunos`,
    },
    dimensoes: [
      {
        codigo: 'curso',
        nome: 'Por curso',
        sql: `
          WITH vendas AS (
            SELECT curso_id, sum(valor) AS valor, count(*) AS n
              FROM public.fato_base_alunos
             WHERE data_matricula >= $1::date AND data_matricula < $2::date
             GROUP BY 1)
          SELECT coalesce(c.nome_curso, 'Sem curso vinculado') AS rotulo,
                 sum(v.valor)::float8 AS valor, sum(v.n)::int AS quantidade
            FROM vendas v LEFT JOIN public.dim_cursos c ON c.curso_id = v.curso_id
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
      {
        codigo: 'consultor',
        nome: 'Por consultor(a)',
        sql: `
          WITH vendas AS (
            SELECT consultor_id, sum(valor) AS valor, count(*) AS n
              FROM public.fato_base_alunos
             WHERE data_matricula >= $1::date AND data_matricula < $2::date
             GROUP BY 1)
          SELECT coalesce(c.nome, 'Sem consultor') AS rotulo,
                 sum(v.valor)::float8 AS valor, sum(v.n)::int AS quantidade
            FROM vendas v LEFT JOIN public.dim_consultores c ON c.consultor_id = v.consultor_id
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
      {
        codigo: 'origem',
        nome: 'Por origem do lead',
        sql: `
          SELECT coalesce(origem_lead, 'Sem origem') AS rotulo,
                 sum(valor)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_base_alunos
           WHERE data_matricula >= $1::date AND data_matricula < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'data', nome: 'Matrícula', tipo: 'data' },
        { chave: 'curso', nome: 'Curso', tipo: 'texto' },
        { chave: 'turma', nome: 'Turma', tipo: 'texto' },
        { chave: 'valor', nome: 'Valor', tipo: 'brl' },
        { chave: 'origem', nome: 'Origem', tipo: 'texto' },
      ],
      sql: `
        SELECT to_char(a.data_matricula, 'YYYY-MM-DD') AS data,
               coalesce(c.nome_curso, '—') AS curso,
               coalesce(a.turma, '—') AS turma,
               a.valor::float8 AS valor,
               coalesce(a.origem_lead, '—') AS origem
          FROM public.fato_base_alunos a
          LEFT JOIN public.dim_cursos c ON c.curso_id = a.curso_id
         WHERE a.data_matricula >= $1::date AND a.data_matricula < $2::date
         ORDER BY a.data_matricula DESC, a.valor DESC NULLS LAST LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(valor)::float8 AS soma
          FROM public.fato_base_alunos
         WHERE data_matricula >= $1::date AND data_matricula < $2::date`,
    },
  },

  {
    codigo: 'matriculas',
    nome: 'Matrículas',
    curto: 'Matrículas',
    descricao: 'Quantidade de matrículas fechadas no período.',
    formula: 'Contagem de linhas de fato_base_alunos pela data da matrícula.',
    setor: 'comercial',
    unidade: 'qtd',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'salesforce', rotulo: 'Salesforce', tabela: 'fato_base_alunos' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 120,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_matricula), 'YYYY-MM-DD') AS mes, count(*)::float8 AS valor
          FROM public.fato_base_alunos
         WHERE data_matricula IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_matricula, 'YYYY-MM-DD') AS dia, count(*)::float8 AS valor
          FROM public.fato_base_alunos
         WHERE data_matricula >= $1::date AND data_matricula < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_matricula), 'YYYY-MM-DD') AS ate FROM public.fato_base_alunos`,
    },
    dimensoes: [
      {
        codigo: 'curso',
        nome: 'Por curso',
        sql: `
          WITH vendas AS (
            SELECT curso_id, count(*) AS n
              FROM public.fato_base_alunos
             WHERE data_matricula >= $1::date AND data_matricula < $2::date
             GROUP BY 1)
          SELECT coalesce(c.nome_curso, 'Sem curso vinculado') AS rotulo,
                 sum(v.n)::float8 AS valor, sum(v.n)::int AS quantidade
            FROM vendas v LEFT JOIN public.dim_cursos c ON c.curso_id = v.curso_id
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'ticket_medio_cursos',
    nome: 'Ticket médio de curso',
    curto: 'Ticket médio',
    descricao: 'Valor médio do contrato de matrícula no mês.',
    formula: 'Soma de fato_base_alunos.valor ÷ quantidade de matrículas, por mês da matrícula.',
    setor: 'comercial',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    razao: true,
    fonte: { integracao: 'salesforce', rotulo: 'Salesforce', tabela: 'fato_base_alunos' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 130,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_matricula), 'YYYY-MM-DD') AS mes,
               (sum(valor) / nullif(count(*), 0))::float8 AS valor
          FROM public.fato_base_alunos
         WHERE data_matricula IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_matricula), 'YYYY-MM-DD') AS ate FROM public.fato_base_alunos`,
    },
    dimensoes: [],
  },

  /* ============================ MARKETING ============================ */
  {
    codigo: 'leads',
    nome: 'Leads (negócios criados)',
    curto: 'Leads',
    descricao:
      'Negócios criados no Clint. A fonte NÃO tem carga automática: os dados vieram ' +
      'inteiros na migração e congelam na data mostrada em "dados até".',
    formula: 'Contagem de fato_negocio_lead pela data de criação do negócio.',
    setor: 'marketing',
    unidade: 'qtd',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'clint', rotulo: 'Clint', tabela: 'fato_negocio_lead' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 210,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_criacao), 'YYYY-MM-DD') AS mes, count(*)::float8 AS valor
          FROM public.fato_negocio_lead
         WHERE data_criacao IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_criacao::date, 'YYYY-MM-DD') AS dia, count(*)::float8 AS valor
          FROM public.fato_negocio_lead
         WHERE data_criacao >= $1::date AND data_criacao < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_criacao)::date, 'YYYY-MM-DD') AS ate FROM public.fato_negocio_lead`,
    },
    dimensoes: [
      {
        codigo: 'origem',
        nome: 'Por origem',
        sql: `
          WITH negocios AS (
            SELECT origem_id, count(*) AS n
              FROM public.fato_negocio_lead
             WHERE data_criacao >= $1::date AND data_criacao < $2::date
             GROUP BY 1)
          SELECT coalesce(o.nome, 'Sem origem') AS rotulo, sum(n.n)::float8 AS valor, sum(n.n)::int AS quantidade
            FROM negocios n LEFT JOIN public.dim_origens o ON o.origem_id = n.origem_id
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'campanha',
        nome: 'Por campanha',
        sql: `
          SELECT coalesce(nome_campanha, 'Sem campanha') AS rotulo, count(*)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_negocio_lead
           WHERE data_criacao >= $1::date AND data_criacao < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'etapa',
        nome: 'Por etapa do funil',
        sql: `
          SELECT coalesce(etapa_funil, 'Sem etapa') AS rotulo, count(*)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_negocio_lead
           WHERE data_criacao >= $1::date AND data_criacao < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'investimento_ads',
    nome: 'Investimento em anúncios (Meta)',
    curto: 'Investimento · ads',
    descricao: 'Gasto diário no Meta Ads. Meta cadastrada funciona como teto de orçamento.',
    formula: 'Soma de fato_meta_insights.gasto pela data do anúncio.',
    setor: 'marketing',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'meta_ads', rotulo: 'Meta Ads', tabela: 'fato_meta_insights' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 220,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data), 'YYYY-MM-DD') AS mes, sum(gasto)::float8 AS valor
          FROM public.fato_meta_insights
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data, 'YYYY-MM-DD') AS dia, sum(gasto)::float8 AS valor
          FROM public.fato_meta_insights
         WHERE data >= $1::date AND data < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data), 'YYYY-MM-DD') AS ate FROM public.fato_meta_insights`,
    },
    dimensoes: [
      {
        codigo: 'campanha',
        nome: 'Por campanha',
        sql: `
          SELECT coalesce(campanha_nome, campanha_id) AS rotulo,
                 sum(gasto)::float8 AS valor, sum(coalesce(leads, 0))::int AS quantidade
            FROM public.fato_meta_insights
           WHERE data >= $1::date AND data < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'cpl',
    nome: 'Custo por lead (Meta)',
    curto: 'CPL',
    descricao: 'Quanto custou cada lead vindo dos anúncios do Meta, no mês.',
    formula: 'Soma do gasto ÷ soma dos leads de fato_meta_insights, por mês.',
    setor: 'marketing',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    razao: true,
    fonte: { integracao: 'meta_ads', rotulo: 'Meta Ads', tabela: 'fato_meta_insights' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 230,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data), 'YYYY-MM-DD') AS mes,
               (sum(gasto) / nullif(sum(leads), 0))::float8 AS valor
          FROM public.fato_meta_insights
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data), 'YYYY-MM-DD') AS ate FROM public.fato_meta_insights`,
    },
    dimensoes: [],
  },

  /* ============================ EVENTOS ============================ */
  {
    codigo: 'receita_eventos',
    nome: 'Receita de eventos (líquida)',
    curto: 'Receita · eventos',
    descricao:
      'Receita líquida dos pedidos do Sympla — o que chega ao caixa depois da taxa da ' +
      'plataforma. Nunca se soma com a receita de cursos.',
    formula: 'Soma de fato_pedidos.valor_liquido pela data do pedido.',
    setor: 'eventos',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'sympla', rotulo: 'Sympla', tabela: 'fato_pedidos' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 310,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pedido_dia), 'YYYY-MM-DD') AS mes,
               sum(valor_liquido)::float8 AS valor
          FROM public.fato_pedidos
         WHERE data_pedido_dia IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_pedido_dia, 'YYYY-MM-DD') AS dia, sum(valor_liquido)::float8 AS valor
          FROM public.fato_pedidos
         WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pedido_dia), 'YYYY-MM-DD') AS ate FROM public.fato_pedidos`,
    },
    dimensoes: [
      {
        codigo: 'evento',
        nome: 'Por evento',
        sql: `
          WITH pedidos AS (
            SELECT evento_id, sum(valor_liquido) AS valor, count(*) AS n
              FROM public.fato_pedidos
             WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
             GROUP BY 1)
          SELECT coalesce(e.nome_evento, 'Evento não identificado') AS rotulo,
                 sum(p.valor)::float8 AS valor, sum(p.n)::int AS quantidade
            FROM pedidos p LEFT JOIN public.dim_eventos e ON e.evento_id = p.evento_id
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
      {
        codigo: 'forma',
        nome: 'Por forma de pagamento',
        sql: `
          SELECT coalesce(forma_pagamento, 'Não informada') AS rotulo,
                 sum(valor_liquido)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_pedidos
           WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'data', nome: 'Pedido', tipo: 'data' },
        { chave: 'evento', nome: 'Evento', tipo: 'texto' },
        { chave: 'liquido', nome: 'Líquido', tipo: 'brl' },
        { chave: 'bruto', nome: 'Bruto', tipo: 'brl' },
        { chave: 'forma', nome: 'Forma', tipo: 'texto' },
      ],
      sql: `
        SELECT to_char(p.data_pedido_dia, 'YYYY-MM-DD') AS data,
               coalesce(e.nome_evento, '—') AS evento,
               p.valor_liquido::float8 AS liquido,
               p.valor_total::float8 AS bruto,
               coalesce(p.forma_pagamento, '—') AS forma
          FROM public.fato_pedidos p
          LEFT JOIN public.dim_eventos e ON e.evento_id = p.evento_id
         WHERE p.data_pedido_dia >= $1::date AND p.data_pedido_dia < $2::date
         ORDER BY p.data_pedido_dia DESC, p.valor_liquido DESC NULLS LAST LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(valor_liquido)::float8 AS soma
          FROM public.fato_pedidos
         WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date`,
    },
  },

  {
    codigo: 'ingressos',
    nome: 'Ingressos vendidos',
    curto: 'Ingressos',
    descricao: 'Participantes registrados nos pedidos do Sympla.',
    formula: 'Contagem de fato_participantes pela data do pedido.',
    setor: 'eventos',
    unidade: 'qtd',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'sympla', rotulo: 'Sympla', tabela: 'fato_participantes' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 320,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pedido_dia), 'YYYY-MM-DD') AS mes, count(*)::float8 AS valor
          FROM public.fato_participantes
         WHERE data_pedido_dia IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_pedido_dia, 'YYYY-MM-DD') AS dia, count(*)::float8 AS valor
          FROM public.fato_participantes
         WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pedido_dia), 'YYYY-MM-DD') AS ate FROM public.fato_participantes`,
    },
    dimensoes: [
      {
        codigo: 'evento',
        nome: 'Por evento',
        sql: `
          WITH parts AS (
            SELECT evento_id, count(*) AS n
              FROM public.fato_participantes
             WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
             GROUP BY 1)
          SELECT coalesce(e.nome_evento, 'Evento não identificado') AS rotulo,
                 sum(p.n)::float8 AS valor, sum(p.n)::int AS quantidade
            FROM parts p LEFT JOIN public.dim_eventos e ON e.evento_id = p.evento_id
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'tipo',
        nome: 'Por tipo de ingresso',
        sql: `
          SELECT coalesce(tipo_ingresso, 'Sem tipo') AS rotulo, count(*)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_participantes
           WHERE data_pedido_dia >= $1::date AND data_pedido_dia < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'taxa_sympla',
    nome: 'Taxa retida pelo Sympla',
    curto: 'Taxa · Sympla',
    descricao: 'Quanto a plataforma reteve dos pedidos do mês (~11,5% do bruto).',
    formula: 'Soma de (valor_total − valor_liquido) de fato_pedidos pela data do pedido.',
    setor: 'eventos',
    unidade: 'brl',
    direcao: 'menor_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'sympla', rotulo: 'Sympla', tabela: 'fato_pedidos' },
    metaFonte: null,
    naVisaoGeral: false,
    ordem: 330,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_pedido_dia), 'YYYY-MM-DD') AS mes,
               sum(valor_total - valor_liquido)::float8 AS valor
          FROM public.fato_pedidos
         WHERE data_pedido_dia IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_pedido_dia), 'YYYY-MM-DD') AS ate FROM public.fato_pedidos`,
    },
    dimensoes: [],
  },

  /* ============================ LOJA ============================ */
  {
    codigo: 'receita_loja',
    nome: 'Receita da loja (PDV)',
    curto: 'Receita · loja',
    descricao:
      'Cupons emitidos no PDV da loja (Omie), sem cancelados nem devolvidos. A meta vem ' +
      'da planilha oficial de metas da loja (nível básico; mínima e máster na tela analítica).',
    formula: 'Soma de fato_loja_cupom.valor com cancelado = false e devolvido = false, pela data de emissão.',
    setor: 'loja',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'omie', rotulo: 'Loja (Omie)', tabela: 'fato_loja_cupom' },
    metaFonte: 'loja',
    naVisaoGeral: true,
    ordem: 410,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_emissao), 'YYYY-MM-DD') AS mes, sum(valor)::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO}
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_emissao, 'YYYY-MM-DD') AS dia, sum(valor)::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO} AND data_emissao >= $1::date AND data_emissao < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_emissao), 'YYYY-MM-DD') AS ate FROM public.fato_loja_cupom`,
    },
    dimensoes: [
      {
        codigo: 'produto',
        nome: 'Por produto',
        // Cancelamento de ITEM difere do de cupom: filtra os dois.
        sql: `
          SELECT coalesce(i.descricao, 'Sem descrição') AS rotulo,
                 sum(i.valor_item)::float8 AS valor, sum(i.quantidade)::int AS quantidade
            FROM public.fato_loja_item i
            JOIN public.fato_loja_cupom c ON c.cupom_id = i.cupom_id
           WHERE NOT coalesce(c.cancelado, false) AND NOT coalesce(c.devolvido, false)
             AND NOT coalesce(i.cancelado, false)
             AND c.data_emissao >= $1::date AND c.data_emissao < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
      {
        codigo: 'forma',
        nome: 'Por forma de pagamento',
        sql: `
          SELECT coalesce(p.forma, 'Não informada') AS rotulo,
                 sum(p.valor)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_loja_pagamento p
            JOIN public.fato_loja_cupom c ON c.cupom_id = p.cupom_id
           WHERE NOT coalesce(c.cancelado, false) AND NOT coalesce(c.devolvido, false)
             AND c.data_emissao >= $1::date AND c.data_emissao < $2::date
           GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      },
    ],
    detalhe: {
      colunas: [
        { chave: 'data', nome: 'Emissão', tipo: 'data' },
        { chave: 'cupom', nome: 'Cupom', tipo: 'texto' },
        { chave: 'valor', nome: 'Valor', tipo: 'brl' },
      ],
      sql: `
        SELECT to_char(data_emissao, 'YYYY-MM-DD') AS data,
               coalesce(numero_cupom::text, cupom_id::text) AS cupom,
               valor::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO} AND data_emissao >= $1::date AND data_emissao < $2::date
         ORDER BY data_emissao DESC, valor DESC NULLS LAST LIMIT $3 OFFSET $4`,
      sqlTotal: `
        SELECT count(*)::int AS total, sum(valor)::float8 AS soma
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO} AND data_emissao >= $1::date AND data_emissao < $2::date`,
    },
  },

  {
    codigo: 'cupons_loja',
    nome: 'Vendas da loja (cupons)',
    curto: 'Vendas · loja',
    descricao: 'Quantidade de cupons emitidos no PDV, sem cancelados nem devolvidos.',
    formula: 'Contagem de fato_loja_cupom válidos pela data de emissão.',
    setor: 'loja',
    unidade: 'qtd',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    fonte: { integracao: 'omie', rotulo: 'Loja (Omie)', tabela: 'fato_loja_cupom' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 420,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_emissao), 'YYYY-MM-DD') AS mes, count(*)::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO}
         GROUP BY 1 ORDER BY 1`,
      serieDiaria: `
        SELECT to_char(data_emissao, 'YYYY-MM-DD') AS dia, count(*)::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO} AND data_emissao >= $1::date AND data_emissao < $2::date
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_emissao), 'YYYY-MM-DD') AS ate FROM public.fato_loja_cupom`,
    },
    dimensoes: [],
  },

  {
    codigo: 'ticket_loja',
    nome: 'Ticket médio da loja',
    curto: 'Ticket · loja',
    descricao: 'Valor médio por cupom no mês.',
    formula: 'Soma dos cupons válidos ÷ quantidade de cupons, por mês de emissão.',
    setor: 'loja',
    unidade: 'brl',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    razao: true,
    fonte: { integracao: 'omie', rotulo: 'Loja (Omie)', tabela: 'fato_loja_cupom' },
    metaFonte: 'cadastro',
    naVisaoGeral: false,
    ordem: 430,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_emissao), 'YYYY-MM-DD') AS mes,
               (sum(valor) / nullif(count(*), 0))::float8 AS valor
          FROM public.fato_loja_cupom
         WHERE ${CUPOM_VALIDO}
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_emissao), 'YYYY-MM-DD') AS ate FROM public.fato_loja_cupom`,
    },
    dimensoes: [],
  },

  /* ============================ PEDAGÓGICO ============================ */
  {
    codigo: 'nps_cursos',
    nome: 'NPS dos cursos',
    curto: 'NPS · cursos',
    descricao: 'Nota média de recomendação das avaliações de curso respondidas no mês.',
    formula: 'Média de fato_avaliacao.nps pelo mês da data do curso avaliado.',
    setor: 'pedagogico',
    unidade: 'nota',
    direcao: 'maior_melhor',
    tipo: 'fluxo',
    razao: true,
    // Sem linha em integracao_status: a tabela é alimentada pelo upload de
    // avaliações no próprio portal, não por ETL — a qualidade sai do cobreAte.
    fonte: { integracao: 'portal', rotulo: 'Avaliações (portal)', tabela: 'fato_avaliacao' },
    metaFonte: 'cadastro',
    naVisaoGeral: true,
    ordem: 510,
    sql: {
      serieMensal: `
        SELECT to_char(date_trunc('month', data_curso), 'YYYY-MM-DD') AS mes, avg(nps)::float8 AS valor
          FROM public.fato_avaliacao
         WHERE data_curso IS NOT NULL AND nps IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
      cobreAte: `SELECT to_char(max(data_curso), 'YYYY-MM-DD') AS ate FROM public.fato_avaliacao WHERE nps IS NOT NULL`,
    },
    dimensoes: [
      {
        codigo: 'curso',
        nome: 'Por curso',
        sql: `
          SELECT coalesce(curso, 'Sem curso') AS rotulo, avg(nps)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_avaliacao
           WHERE data_curso >= $1::date AND data_curso < $2::date AND nps IS NOT NULL
           GROUP BY 1 ORDER BY 3 DESC LIMIT 12`,
      },
      {
        codigo: 'treinador',
        nome: 'Por treinador',
        sql: `
          SELECT coalesce(treinador, 'Sem treinador') AS rotulo, avg(nps)::float8 AS valor, count(*)::int AS quantidade
            FROM public.fato_avaliacao
           WHERE data_curso >= $1::date AND data_curso < $2::date AND nps IS NOT NULL
           GROUP BY 1 ORDER BY 3 DESC LIMIT 12`,
      },
    ],
  },

  /* ============================ ESTOQUE ============================ */
  {
    codigo: 'estoque_valor',
    nome: 'Valor em estoque (a custo)',
    curto: 'Estoque · valor',
    descricao: 'Posição atual do estoque da loja valorizada a custo médio.',
    formula: 'Soma de saldo × custo_medio de fato_loja_estoque, na posição mais recente.',
    setor: 'estoque',
    unidade: 'brl',
    direcao: 'neutra',
    tipo: 'estado',
    fonte: { integracao: 'omie', rotulo: 'Loja (Omie)', tabela: 'fato_loja_estoque' },
    metaFonte: null,
    naVisaoGeral: false,
    ordem: 610,
    sql: {
      estadoAtual: `
        SELECT sum(saldo * custo_medio)::float8 AS valor, count(*)::int AS quantidade,
               to_char(max(data_posicao), 'YYYY-MM-DD') AS referencia
          FROM public.fato_loja_estoque
         WHERE saldo IS NOT NULL AND custo_medio IS NOT NULL`,
      cobreAte: `SELECT to_char(max(data_posicao), 'YYYY-MM-DD') AS ate FROM public.fato_loja_estoque`,
    },
    dimensoes: [
      {
        codigo: 'produto',
        nome: 'Maiores posições',
        sql: `
          SELECT coalesce(descricao, codigo, produto_id::text) AS rotulo,
                 (saldo * custo_medio)::float8 AS valor, saldo::int AS quantidade
            FROM public.fato_loja_estoque
           WHERE saldo IS NOT NULL AND custo_medio IS NOT NULL AND ($1::date IS NOT NULL OR $2::date IS NOT NULL)
           ORDER BY 2 DESC NULLS LAST LIMIT 12`,
      },
    ],
  },

  {
    codigo: 'estoque_criticos',
    nome: 'Itens abaixo do estoque mínimo',
    curto: 'Estoque · críticos',
    descricao: 'Produtos cuja posição atual está abaixo do mínimo cadastrado.',
    formula: 'Contagem de fato_loja_estoque com saldo < estoque_minimo (mínimo > 0).',
    setor: 'estoque',
    unidade: 'qtd',
    direcao: 'menor_melhor',
    tipo: 'estado',
    fonte: { integracao: 'omie', rotulo: 'Loja (Omie)', tabela: 'fato_loja_estoque' },
    metaFonte: null,
    naVisaoGeral: false,
    ordem: 620,
    sql: {
      estadoAtual: `
        SELECT count(*)::float8 AS valor, count(*)::int AS quantidade,
               to_char(max(data_posicao), 'YYYY-MM-DD') AS referencia
          FROM public.fato_loja_estoque
         WHERE coalesce(estoque_minimo, 0) > 0 AND saldo < estoque_minimo`,
      cobreAte: `SELECT to_char(max(data_posicao), 'YYYY-MM-DD') AS ate FROM public.fato_loja_estoque`,
    },
    dimensoes: [
      {
        codigo: 'produto',
        nome: 'Itens críticos',
        sql: `
          SELECT coalesce(descricao, codigo, produto_id::text) AS rotulo,
                 saldo::float8 AS valor, estoque_minimo::int AS quantidade
            FROM public.fato_loja_estoque
           WHERE coalesce(estoque_minimo, 0) > 0 AND saldo < estoque_minimo
             AND ($1::date IS NOT NULL OR $2::date IS NOT NULL)
           ORDER BY (estoque_minimo - saldo) DESC LIMIT 12`,
      },
    ],
  },
];

const POR_CODIGO = new Map(INDICADORES.map((d) => [d.codigo, d]));

export const indicadorPorCodigo = (codigo: string): DefinicaoIndicador | undefined =>
  POR_CODIGO.get(codigo);

/** Setores que têm pelo menos um indicador — a lista de blocos do painel. */
export const SETORES_COM_INDICADOR: readonly Setor[] = [
  ...new Set(INDICADORES.map((d) => d.setor)),
];

export const NOME_SETOR: Record<string, string> = {
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  marketing: 'Marketing',
  eventos: 'Eventos',
  loja: 'Loja',
  pedagogico: 'Pedagógico',
  estoque: 'Estoque',
  geral: 'Geral',
};
