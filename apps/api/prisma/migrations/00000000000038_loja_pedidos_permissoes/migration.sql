-- ====================================================================
-- FebraHub · Migration 38 — Registro ADITIVO das permissões dos perfis
-- padrão para LOJA · Pedidos e Fila (loja.pedidos.*).
--
-- A migration 36 criou as tabelas de pedidos/fila e o catálogo (32) já traz
-- as de produtos/estoque, mas NENHUMA semeou `loja.pedidos.*` nos perfis —
-- só o admin (sincronizado com o catálogo inteiro no boot) enxergava a fila.
-- Isso deixava a líder operacional (Jéssica) e a equipe de balcão sem acesso.
--
-- Este é o registro canônico e idempotente que casa perfis-padrao.ts com o
-- que roda em produção. Segue o padrão das *_permissoes anteriores (32, 26…).
--
-- diretoria: fila completa (ver/operar/gerenciar).
-- gestor:    fila completa — é o perfil da liderança da Loja (abrir/encerrar
--            operações e cancelar pedidos).
-- equipe:    ver + operar — balcão chama o próximo, prepara e entrega, mas
--            não abre/encerra operação nem cancela.
-- ====================================================================

WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria', 'loja.pedidos.ver'),
  ('diretoria', 'loja.pedidos.operar'),
  ('diretoria', 'loja.pedidos.gerenciar'),
  ('gestor', 'loja.pedidos.ver'),
  ('gestor', 'loja.pedidos.operar'),
  ('gestor', 'loja.pedidos.gerenciar'),
  ('equipe', 'loja.pedidos.ver'),
  ('equipe', 'loja.pedidos.operar')
), agrupadas AS (
  SELECT slug, array_agg(permissao) AS permissoes FROM adicoes GROUP BY slug
)
UPDATE perfis_acesso p
SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || a.permissoes))
FROM agrupadas a
WHERE p.slug = a.slug;

-- admin recebe tudo (onModuleInit também sincroniza, mas mantemos explícito).
UPDATE perfis_acesso
SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY[
  'loja.pedidos.ver','loja.pedidos.operar','loja.pedidos.gerenciar'
]))
WHERE slug = 'admin';
