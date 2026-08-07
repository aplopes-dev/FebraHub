-- ============================================================================
-- Permissões do painel de redes sociais nos perfis padrão.
--
-- Mesma forma da 16 (GBrain), pelo mesmo motivo: a 14 já rodou em produção e
-- perfil que existe NÃO é reescrito — senão um ajuste feito na tela de Perfis
-- seria desfeito pelo deploy seguinte. A operação aqui é ADITIVA e restrita
-- aos cinco perfis que nascem com o sistema; perfil criado pela diretoria não
-- é tocado.
--
-- `admin` não aparece: recebe toda permissão nova do catálogo no boot da API
-- (PermissoesService.onModuleInit).
--
-- Idempotente: a união com o que já existe não duplica nada.
-- ============================================================================

WITH novas AS (
  SELECT slug, array_agg(permissao) AS perms
    FROM (
      VALUES
        ('diretoria',   'social.ver'),
        ('diretoria',   'social.publicar'),
        ('diretoria',   'social.gerenciar'),
        ('gestor',      'social.ver'),
        ('integracoes', 'social.ver'),
        ('integracoes', 'social.gerenciar'),
        ('consulta',    'social.ver')
    ) AS v (slug, permissao)
   GROUP BY slug
)
UPDATE public.perfis_acesso p
   SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || n.perms)),
       atualizado_em = now()
  FROM novas n
 WHERE p.slug = n.slug
   AND NOT (p.permissoes @> n.perms);
