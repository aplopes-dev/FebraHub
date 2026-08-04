-- ============================================================================
-- Permissões do GBrain nos perfis padrão.
--
-- Migration à parte da 14 porque aquela já rodou em produção: perfil que
-- existe não é reescrito, senão um ajuste feito na tela seria desfeito pelo
-- deploy seguinte. Aqui a operação é ADITIVA e restrita aos cinco perfis que
-- nascem com o sistema — o que a diretoria tiver criado depois não é tocado.
--
-- O perfil `admin` não aparece: ele recebe TODA permissão nova do catálogo
-- automaticamente no boot da API (PermissoesService.onModuleInit).
--
-- Idempotente: a união com o que já existe não duplica nada.
-- ============================================================================

WITH novas AS (
  SELECT slug, array_agg(permissao) AS perms
    FROM (
      VALUES
        ('diretoria',   'brain.ver'),
        ('diretoria',   'brain.enviar'),
        ('diretoria',   'brain.gerenciar'),
        ('gestor',      'brain.ver'),
        ('gestor',      'brain.enviar'),
        ('equipe',      'brain.ver'),
        ('integracoes', 'brain.gerenciar'),
        ('consulta',    'brain.ver')
    ) AS v (slug, permissao)
   GROUP BY slug
)
UPDATE public.perfis_acesso p
   SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || n.perms)),
       atualizado_em = now()
  FROM novas n
 WHERE p.slug = n.slug
   AND NOT (p.permissoes @> n.perms);
