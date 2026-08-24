-- ====================================================================
-- FebraHub · Migration 32 — Registro ADITIVO das permissões dos perfis
-- padrão para PDV, Financeiro ERP e Catálogo/Estoque da Loja.
--
-- A migration 30 criou as tabelas do PDV/Financeiro mas NÃO semeou as
-- permissões nos perfis; a 31 criou o catálogo/estoque da Loja. Este é o
-- registro canônico e idempotente que casa perfis-padrao.ts com o que roda
-- em produção (a imagem da API não tem ts-node para o seed). Segue o mesmo
-- padrão das *_permissoes anteriores (16, 20, 25, 26).
--
-- diretoria: PDV completo, Loja completa, Financeiro completo.
-- gestor:    PDV (ver/operar), Loja completa, Financeiro (ver).
-- ====================================================================

WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria', 'pdv.ver'),
  ('diretoria', 'pdv.operar'),
  ('diretoria', 'pdv.gerenciar'),
  ('diretoria', 'loja.produtos.ver'),
  ('diretoria', 'loja.produtos.gerenciar'),
  ('diretoria', 'financeiro.erp.ver'),
  ('diretoria', 'financeiro.gerenciar'),
  ('gestor', 'pdv.ver'),
  ('gestor', 'pdv.operar'),
  ('gestor', 'loja.produtos.ver'),
  ('gestor', 'loja.produtos.gerenciar'),
  ('gestor', 'financeiro.erp.ver')
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
  'pdv.ver','pdv.operar','pdv.gerenciar',
  'loja.produtos.ver','loja.produtos.gerenciar',
  'financeiro.erp.ver','financeiro.gerenciar'
]))
WHERE slug = 'admin';
