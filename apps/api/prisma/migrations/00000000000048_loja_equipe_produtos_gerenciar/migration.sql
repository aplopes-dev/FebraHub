-- ====================================================================
-- FebraHub · Migration 48 — Permissão loja.produtos.gerenciar para equipe
--
-- O perfil "equipe" (padrão da loja) tinha apenas loja.produtos.ver, o que
-- impedia o usuário loja de EDITAR produtos (criar, alterar nome/desc/imagem/
-- flags, ajustar estoque, transferir entre LOJA e DEPÓSITO).
--
-- A migration 32 concedeu gerenciar apenas a diretoria e gestor; a 38 deu
-- loja.pedidos.operar à equipe (balcão). Esta migration completa o acesso:
-- usuários do setor loja (perfil equipe) podem agora editar produtos.
--
-- Idempotente: usa unnest + DISTINCT para não duplicar permissões.
-- ====================================================================

WITH adicoes(slug, permissao) AS (VALUES
  ('equipe', 'loja.produtos.gerenciar')
), agrupadas AS (
  SELECT slug, array_agg(permissao) AS permissoes FROM adicoes GROUP BY slug
)
UPDATE perfis_acesso p
SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || a.permissoes))
FROM agrupadas a
WHERE p.slug = a.slug;
