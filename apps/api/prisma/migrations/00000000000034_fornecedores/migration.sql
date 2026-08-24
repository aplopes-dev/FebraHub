-- ====================================================================
-- FebraHub · Migration 34 — FORNECEDORES: cadastro corporativo único
--
-- CONTEXTO (PRD Compras/Estoque/Fornecedores, §36/§37):
--   Até aqui o fornecedor vivia como texto livre repetido em cada cotação e
--   pedido de compra (compra_cotacoes.fornecedor, compra_pedidos.fornecedor).
--   O PRD exige um cadastro corporativo ÚNICO, não duplicado por módulo/setor,
--   capaz de consolidar histórico de pedidos, preços, prazos e ocorrências.
--
--   Esta migration cria `fornecedores` + `fornecedor_contatos` e liga cotação
--   e pedido a ele por `fornecedor_id` OPCIONAL — o texto continua existindo
--   para propostas de fornecedor ainda não cadastrado (a ausência de cadastro
--   nunca deve travar o fluxo). Compras pode depois vincular a proposta ao
--   fornecedor corporativo.
-- ====================================================================

-- -------------------- FORNECEDORES --------------------
CREATE TABLE fornecedores (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social         text NOT NULL,
  nome_fantasia        text,
  documento            text,                 -- CPF/CNPJ só dígitos
  inscricao            text,
  email                text,
  telefone             text,
  whatsapp             text,
  endereco             text,
  cidade               text,
  uf                   varchar(2),
  cep                  text,
  categorias           text[] NOT NULL DEFAULT '{}',
  banco                text,
  agencia              text,
  conta                text,
  chave_pix            text,
  prazo_medio_dias     int,
  condicoes_comerciais text,
  situacao             text NOT NULL DEFAULT 'ativo'
                         CHECK (situacao IN ('ativo','inativo','bloqueado','em_homologacao')),
  observacoes          text,
  documentos           jsonb NOT NULL DEFAULT '[]',
  criado_por           uuid,
  criado_em            timestamptz NOT NULL DEFAULT now(),
  atualizado_em        timestamptz NOT NULL DEFAULT now()
);
-- documento único quando informado (não duplicar o mesmo CNPJ/CPF)
CREATE UNIQUE INDEX fornecedores_documento_uk
  ON fornecedores (documento) WHERE documento IS NOT NULL AND documento <> '';
CREATE INDEX fornecedores_situacao_idx ON fornecedores (situacao, razao_social);

-- -------------------- CONTATOS DO FORNECEDOR --------------------
CREATE TABLE fornecedor_contatos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  cargo         text,
  email         text,
  telefone      text,
  principal     boolean NOT NULL DEFAULT false,
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fornecedor_contatos_fornecedor_idx ON fornecedor_contatos (fornecedor_id);

-- -------------------- VÍNCULO COM COTAÇÃO / PEDIDO --------------------
ALTER TABLE compra_cotacoes
  ADD COLUMN fornecedor_id uuid REFERENCES fornecedores(id) ON DELETE SET NULL;
CREATE INDEX compra_cotacoes_fornecedor_idx ON compra_cotacoes (fornecedor_id);

ALTER TABLE compra_pedidos
  ADD COLUMN fornecedor_id uuid REFERENCES fornecedores(id) ON DELETE SET NULL;
CREATE INDEX compra_pedidos_fornecedor_idx ON compra_pedidos (fornecedor_id);
