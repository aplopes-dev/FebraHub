-- ====================================================================
-- FebraHub · Migration 55 — OMIE: vínculo por código de integração
--
-- Best practice de integração de produtos com o Omie (conforme a própria
-- documentação da Omie):
--   • `codigo` (SKU) NÃO deve ser usado como chave de integração — o usuário
--     pode alterá-lo a qualquer momento.
--   • `codigo_produto_integracao` É o campo próprio para o vínculo com o
--     sistema externo (o nosso). É imutável do lado do Omie e serve para
--     dedupe na inclusão. É esse campo que passamos a usar como CHAVE do
--     vínculo FebraHub ↔ Omie.
--
-- Passamos a gravar em `loja_produtos.codigo_integracao_omie` o mesmo valor
-- escrito no `codigo_produto_integracao` do produto no Omie (`FH-<uuid>`).
-- `sku_omie` (migration 53) continua guardando o `codigo_produto` (ID interno
-- do Omie), usado como lookup rápido — o VÍNCULO em si agora é por
-- codigo_integracao_omie.
-- ====================================================================

ALTER TABLE public.loja_produtos
  ADD COLUMN IF NOT EXISTS codigo_integracao_omie TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS loja_produtos_codigo_integracao_omie_idx
  ON public.loja_produtos (codigo_integracao_omie)
  WHERE codigo_integracao_omie IS NOT NULL;

COMMENT ON COLUMN public.loja_produtos.codigo_integracao_omie IS
  'Código de integração do produto (codigo_produto_integracao no Omie). Chave imutável do vínculo FebraHub ↔ Omie. Valor = FH-<id do produto>. NULL = ainda não vinculado.';
