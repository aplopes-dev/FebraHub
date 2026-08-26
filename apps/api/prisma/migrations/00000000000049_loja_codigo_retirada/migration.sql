-- ====================================================================
-- FebraHub · Migration 49 — LOJA: Código secreto de retirada (3 dígitos)
--
-- Quando o cliente faz o pedido no cardápio digital, ele recebe um CÓDIGO
-- SECRETO de 3 dígitos (100–999, aleatório). Esse código NÃO é a senha da
-- fila (senha_fila) — a senha_fila é pública e aparece no painel/TV; o código
-- de retirada é privado, mostrado só para o próprio cliente no comprovante.
--
-- No balcão, o vendedor DIGITA esse código para localizar o pedido do cliente,
-- conferir/editar o carrinho e imprimir o cupom. Assim o painel público continua
-- mostrando a senha da fila sem revelar o código secreto de ninguém.
--
--   codigo_retirada -> inteiro 100..999, aleatório; ÚNICO apenas entre os
--                      pedidos ATIVOS (não retirados/cancelados) da MESMA
--                      operação — a unicidade é garantida em código, sob
--                      advisory lock, permitindo reaproveitar códigos de
--                      pedidos já finalizados (senão esgotaria em 900 pedidos).
--
-- Aditivo e idempotente.
-- ====================================================================

ALTER TABLE loja_pedidos
  ADD COLUMN IF NOT EXISTS codigo_retirada integer;

-- Índice (não único) para acelerar a busca do vendedor por código dentro da
-- operação, restrito aos pedidos ativos.
CREATE INDEX IF NOT EXISTS loja_pedidos_codigo_retirada_idx
  ON loja_pedidos (operacao_id, codigo_retirada);
