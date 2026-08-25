-- ====================================================================
-- FebraHub · Migration 42 — COMERCIAL PERMISSÕES
--
-- Adiciona as permissões do módulo Comercial ao perfil admin e
-- cria o perfil padrão "Consultor Comercial".
-- ====================================================================

-- Adicionar permissões comerciais ao perfil admin (se existir)
UPDATE public.perfis_acesso
SET permissoes = array_cat(
  permissoes,
  ARRAY[
    'comercial.ver',
    'comercial.operar',
    'comercial.gerenciar',
    'comercial.vendas.aprovar',
    'comercial.relatorios'
  ]::text[]
)
WHERE slug = 'admin'
  AND NOT (permissoes @> ARRAY['comercial.ver']::text[]);

-- Perfil: Consultor Comercial
INSERT INTO public.perfis_acesso (id, slug, nome, descricao, sistema, permissoes, criado_em, atualizado_em)
VALUES (
  'p0000041-0000-4000-8000-000000000001',
  'consultor-comercial',
  'Consultor Comercial',
  'Acesso à carteira própria, leads atribuídos, pipeline, negociação e fechamento dentro da alçada.',
  false,
  ARRAY[
    'comercial.ver',
    'comercial.operar',
    'setor.comercial.ver'
  ]::text[],
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Perfil: Gestor Comercial
INSERT INTO public.perfis_acesso (id, slug, nome, descricao, sistema, permissoes, criado_em, atualizado_em)
VALUES (
  'p0000041-0000-4000-8000-000000000002',
  'gestor-comercial',
  'Gestor Comercial',
  'Visão da equipe, redistribuição de leads, aprovação de descontos, metas e dashboards.',
  false,
  ARRAY[
    'comercial.ver',
    'comercial.operar',
    'comercial.gerenciar',
    'comercial.vendas.aprovar',
    'comercial.relatorios',
    'setor.comercial.ver'
  ]::text[],
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Perfil: Relacionadora Comercial
INSERT INTO public.perfis_acesso (id, slug, nome, descricao, sistema, permissoes, criado_em, atualizado_em)
VALUES (
  'p0000041-0000-4000-8000-000000000003',
  'relacionadora-comercial',
  'Relacionadora Comercial',
  'Carteira de relacionamento, follow-up, oportunidades e registro de interações.',
  false,
  ARRAY[
    'comercial.ver',
    'comercial.operar',
    'setor.comercial.ver'
  ]::text[],
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
