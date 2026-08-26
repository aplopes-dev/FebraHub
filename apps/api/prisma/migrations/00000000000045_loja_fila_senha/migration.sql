-- ====================================================================
-- FebraHub · Migration 45 — LOJA: SENHA DA FILA separada do número do pedido
--
-- PRD "Fila Operacional + Painel TV". Separa definitivamente três conceitos
-- que estavam colapsados no campo `numero`:
--   • numero      -> identificação transacional do pedido (#1048), inicia 1001.
--   • senha_fila   -> número OPERACIONAL da fila (01, 02, …), inicia em 1 por
--                     operação. Atribuído SÓ quando o pedido entra na fila
--                     (pagamento confirmado + precisa preparo). UNIQUE por
--                     operação; nunca reutilizado (senha cancelada não volta).
--   • posicao_fila -> posição dinâmica (já existia), recalculada quando a fila
--                     anda; a senha NUNCA muda por causa disso.
--
-- Também:
--   • loja_operacoes.cartaz_url    -> pôster do evento p/ 1ª coluna da TV
--                                     (configurável por operação, não hardcoded).
--   • loja_numeracao_pedido.ultima_senha -> contador ATÔMICO da senha (PRD §9),
--     na mesma linha (PK = operacao_id) do contador do número → o UPDATE ...
--     increment trava a linha e serializa geração concorrente (sem duplicar,
--     sem reutilizar). Idempotência do webhook fica no service (só gera senha
--     quando o pedido ainda está AGUARDANDO_PAGAMENTO).
--
-- Tudo aditivo e idempotente (IF NOT EXISTS) — seguro para rodar em bases já
-- populadas de homolog/produção sem tocar nos dados existentes.
-- ====================================================================

-- 1) Senha da fila em loja_pedidos (nullable: só preenche ao entrar na fila).
ALTER TABLE loja_pedidos
  ADD COLUMN IF NOT EXISTS senha_fila integer;

-- INVARIANTE 4 (PRD §46): duas entradas não têm a mesma senha na operação.
-- Índice único aceita múltiplos NULL (pedidos que ainda não entraram na fila).
CREATE UNIQUE INDEX IF NOT EXISTS loja_pedidos_operacao_senha_key
  ON loja_pedidos (operacao_id, senha_fila);

-- Índice p/ ordenar a fila por entrada (mais antigo primeiro) por operação/status.
CREATE INDEX IF NOT EXISTS loja_pedidos_operacao_status_entrou_idx
  ON loja_pedidos (operacao_id, status, entrou_fila_em);

-- 2) Cartaz do evento na operação (1ª coluna da TV).
ALTER TABLE loja_operacoes
  ADD COLUMN IF NOT EXISTS cartaz_url text;

-- 3) Contador atômico da senha na tabela de numeração (uma linha por operação).
ALTER TABLE loja_numeracao_pedido
  ADD COLUMN IF NOT EXISTS ultima_senha integer NOT NULL DEFAULT 0;

-- 4) Permissão RBAC 'loja.produtos.preco' (PRD §40): alterar preço de venda.
-- Espelha os perfis-padrão em produção (o seed com ts-node não roda lá). O
-- catálogo em si é sincronizado no boot; aqui só concedemos aos perfis certos.
-- Idempotente: DISTINCT unnest evita duplicar se rodar de novo.
UPDATE perfis_acesso
SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY['loja.produtos.preco']))
WHERE slug IN ('admin', 'diretoria', 'gestor');

