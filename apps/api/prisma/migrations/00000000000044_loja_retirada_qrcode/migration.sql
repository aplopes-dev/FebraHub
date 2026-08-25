-- ====================================================================
-- FebraHub · Migration 44 — LOJA: Retirada por QR Code (comprovante do cliente)
--
-- Fecha o loop do cardápio digital: depois de PAGAR, o cliente recebe um
-- comprovante com um QR Code único. O vendedor do balcão escaneia esse QR
-- (com o celular/tablet) para VERIFICAR que a compra é real e está paga, ver
-- o que foi comprado e RESGATAR a retirada — sem digitar nada, sem risco de
-- entregar por engano.
--
-- Colunas aditivas em loja_pedidos:
--   token_retirada     -> segredo opaco (base64url, ~43 chars) impresso no QR;
--                         UNIQUE; gerado na confirmação do pagamento; jamais
--                         reutilizado. É a "prova de compra".
--   retirado_por_id    -> usuário (vendedor) que resgatou pelo QR.
--   retirado_por_nome  -> nome do vendedor no momento do resgate (histórico).
--
-- Idempotente: só cria a coluna se ainda não existir.
-- ====================================================================

ALTER TABLE loja_pedidos
  ADD COLUMN IF NOT EXISTS token_retirada    text,
  ADD COLUMN IF NOT EXISTS retirado_por_id   uuid,
  ADD COLUMN IF NOT EXISTS retirado_por_nome text;

-- UNIQUE parcial via índice único padrão (NULLs são permitidos e não colidem).
CREATE UNIQUE INDEX IF NOT EXISTS loja_pedidos_token_retirada_key
  ON loja_pedidos (token_retirada);
