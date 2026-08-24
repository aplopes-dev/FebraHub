-- Registro aditivo canônico das permissões padrão da Central. A migration
-- anterior já fez a atualização junto ao schema; esta mantém o contrato
-- auditável usado pelo seed/testes e é idempotente em ambientes existentes.
WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria', 'processos.ver'),
  ('diretoria', 'processos.validar'),
  ('diretoria', 'processos.implantacao'),
  ('gestor', 'processos.ver'),
  ('gestor', 'processos.mapear'),
  ('gestor', 'processos.validar'),
  ('equipe', 'processos.ver'),
  ('consulta', 'processos.ver')
), agrupadas AS (
  SELECT slug, array_agg(permissao) AS permissoes FROM adicoes GROUP BY slug
)
UPDATE perfis_acesso p
SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || a.permissoes))
FROM agrupadas a
WHERE p.slug = a.slug;
