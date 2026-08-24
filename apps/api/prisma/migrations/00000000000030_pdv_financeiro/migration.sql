-- ====================================================================
-- FebraHub · Migration 30 — PDV (ponto de venda interno) + Financeiro ERP
--
-- PDV escreve direto no banco (sem Omie): a venda baixa o saldo em
-- fato_loja_estoque, registra a saida no MESMO ledger do Compras
-- (compra_movimentos_estoque, tipo='saida') e gera um recebivel no
-- Financeiro. Financeiro ERP = contas a pagar/receber + rateio p/ DRE.
-- ====================================================================

-- -------------------- PDV --------------------
CREATE TABLE pdv_terminais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pdv_caixa_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pdv_terminais(id) ON DELETE CASCADE,
  situacao text NOT NULL DEFAULT 'aberto',
  aberto_em timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz,
  aberto_por_id uuid NOT NULL,
  aberto_por_nome text NOT NULL,
  fundo_abertura numeric(14,2) NOT NULL DEFAULT 0,
  contado_dinheiro numeric(14,2),
  esperado_dinheiro numeric(14,2),
  diferenca numeric(14,2),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pdv_caixa_sessoes_situacao_idx ON pdv_caixa_sessoes(situacao, aberto_em DESC);
CREATE INDEX pdv_caixa_sessoes_terminal_idx ON pdv_caixa_sessoes(terminal_id, situacao);

CREATE TABLE pdv_caixa_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid NOT NULL REFERENCES pdv_caixa_sessoes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('sangria','reforco')),
  valor numeric(14,2) NOT NULL CHECK (valor > 0),
  motivo text NOT NULL DEFAULT '',
  operador_id uuid NOT NULL,
  operador_nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pdv_caixa_movimentos_sessao_idx ON pdv_caixa_movimentos(sessao_id, criado_em DESC);

CREATE TABLE pdv_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  situacao text NOT NULL DEFAULT 'fechada' CHECK (situacao IN ('fechada','cancelada')),
  canal text NOT NULL DEFAULT 'pdv',
  cliente_nome text NOT NULL DEFAULT '',
  cliente_documento text,
  terminal_id uuid REFERENCES pdv_terminais(id) ON DELETE SET NULL,
  sessao_id uuid REFERENCES pdv_caixa_sessoes(id) ON DELETE SET NULL,
  operador_id uuid NOT NULL,
  operador_nome text NOT NULL,
  subtotal numeric(14,2) NOT NULL,
  desconto numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL,
  observacoes text NOT NULL DEFAULT '',
  cancelada_em timestamptz,
  motivo_cancelamento text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pdv_vendas_situacao_idx ON pdv_vendas(situacao, criado_em DESC);
CREATE INDEX pdv_vendas_sessao_idx ON pdv_vendas(sessao_id);

CREATE TABLE pdv_venda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES pdv_vendas(id) ON DELETE CASCADE,
  produto_id bigint,
  descricao text NOT NULL,
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  preco_unit numeric(14,2) NOT NULL,
  total numeric(14,2) NOT NULL
);
CREATE INDEX pdv_venda_itens_venda_idx ON pdv_venda_itens(venda_id);

CREATE TABLE pdv_venda_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES pdv_vendas(id) ON DELETE CASCADE,
  forma_pagamento text NOT NULL,
  valor numeric(14,2) NOT NULL,
  bandeira text,
  parcelas int
);
CREATE INDEX pdv_venda_pagamentos_venda_idx ON pdv_venda_pagamentos(venda_id);

-- -------------------- FINANCEIRO ERP --------------------
CREATE TABLE financeiro_contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  banco text NOT NULL DEFAULT '',
  saldo_inicial numeric(14,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE financeiro_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  sistema boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE financeiro_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  classificacao text NOT NULL DEFAULT 'resultado' CHECK (classificacao IN ('resultado','patrimonial')),
  ordem int NOT NULL DEFAULT 0,
  sistema boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE financeiro_planos_conta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  grupo_id uuid NOT NULL REFERENCES financeiro_grupos(id) ON DELETE RESTRICT,
  disponivel_pdv boolean NOT NULL DEFAULT false,
  sistema boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX financeiro_planos_conta_grupo_idx ON financeiro_planos_conta(grupo_id);

CREATE TABLE financeiro_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao text NOT NULL CHECK (operacao IN ('receber','pagar')),
  descricao text NOT NULL DEFAULT '',
  valor numeric(14,2) NOT NULL,
  juros numeric(14,2) NOT NULL DEFAULT 0,
  multa numeric(14,2) NOT NULL DEFAULT 0,
  valor_pago numeric(14,2) NOT NULL DEFAULT 0,
  situacao text NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente','pago')),
  data_competencia date NOT NULL,
  data_vencimento date NOT NULL,
  pago_em date,
  contraparte text NOT NULL DEFAULT '',
  forma_pagamento text,
  conta_bancaria_id uuid REFERENCES financeiro_contas_bancarias(id) ON DELETE SET NULL,
  venda_id uuid,
  origem text NOT NULL DEFAULT 'manual',
  observacao text NOT NULL DEFAULT '',
  excluido_em timestamptz,
  criado_por_id uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX financeiro_lancamentos_operacao_idx ON financeiro_lancamentos(operacao, data_competencia DESC);
CREATE INDEX financeiro_lancamentos_situacao_idx ON financeiro_lancamentos(situacao, data_vencimento);
CREATE INDEX financeiro_lancamentos_excluido_idx ON financeiro_lancamentos(excluido_em);

CREATE TABLE financeiro_rateios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id uuid NOT NULL REFERENCES financeiro_lancamentos(id) ON DELETE CASCADE,
  plano_conta_id uuid NOT NULL REFERENCES financeiro_planos_conta(id) ON DELETE RESTRICT,
  centro_custo_id uuid NOT NULL REFERENCES financeiro_centros_custo(id) ON DELETE RESTRICT,
  valor numeric(14,2) NOT NULL,
  percentual numeric(7,4) NOT NULL DEFAULT 0
);
CREATE INDEX financeiro_rateios_lancamento_idx ON financeiro_rateios(lancamento_id);

-- -------------------- SEEDS DE SISTEMA --------------------
INSERT INTO pdv_terminais (nome) VALUES ('Caixa 01');

INSERT INTO financeiro_centros_custo (nome, sistema) VALUES
  ('Administrativo', true), ('Operacional', true), ('Comercial', true);

INSERT INTO financeiro_grupos (nome, tipo, classificacao, ordem, sistema) VALUES
  ('Receitas', 'receita', 'resultado', 1, true),
  ('Custos', 'despesa', 'resultado', 2, true),
  ('Despesas Operacionais', 'despesa', 'resultado', 3, true),
  ('Caixa e Bancos', 'receita', 'patrimonial', 9, true);

INSERT INTO financeiro_planos_conta (nome, grupo_id, disponivel_pdv, sistema)
SELECT v.nome, g.id, v.pdv, true
FROM (VALUES
  ('Vendas de Produtos', 'Receitas', true),
  ('Vendas de Serviços', 'Receitas', false),
  ('Compra de Mercadorias', 'Custos', false),
  ('Aluguel', 'Despesas Operacionais', false),
  ('Folha de Pagamento', 'Despesas Operacionais', false),
  ('Energia e Água', 'Despesas Operacionais', false)
) AS v(nome, grupo, pdv)
JOIN financeiro_grupos g ON g.nome = v.grupo;
