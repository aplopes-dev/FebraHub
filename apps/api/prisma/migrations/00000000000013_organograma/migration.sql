-- ============================================================================
-- Organograma — quem faz o quê em cada setor (painel /organograma).
--  * org_membros: nó-folha do grafo radial — funcionário OU agente de IA,
--    com `funcao` como agrupador e `setor` nas mesmas chaves dos hubs do
--    menu (CRM fica de fora do organograma por decisão do Rafael, 03/08).
--  * Nasce com dados MOCK para a tela já abrir viva; o INSERT só roda com a
--    tabela vazia, então re-rodar a migration (ou o operador apagar/editar
--    tudo pela tela) não ressuscita os exemplos.
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.org_membros (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          varchar(12) NOT NULL CHECK (tipo IN ('funcionario','agente')),
  nome          text        NOT NULL,
  funcao        text        NOT NULL,
  setor         text        NOT NULL,
  ordem         integer     NOT NULL DEFAULT 0,
  ativo         boolean     NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_org_membros_setor ON public.org_membros (setor);

-- Mock inicial: 2-4 pessoas por setor + 4 agentes de IA espalhados. Nomes
-- fictícios; a tela de edição substitui pelos reais.
INSERT INTO public.org_membros (tipo, nome, funcao, setor, ordem)
SELECT v.tipo, v.nome, v.funcao, v.setor, v.ordem
FROM (
  VALUES
    -- Comercial
    ('funcionario', 'Ana Beatriz Rocha',    'Coordenação Comercial',   'comercial',  0),
    ('funcionario', 'Juliana Prates',       'Consultora de Vendas',    'comercial',  1),
    ('funcionario', 'Camila Duarte',        'Consultora de Vendas',    'comercial',  2),
    ('agente',      'Agente SDR',           'Pré-vendas',              'comercial',  3),
    -- Financeiro
    ('funcionario', 'Marcos Vinícius Leal', 'Coordenação Financeira',  'financeiro', 0),
    ('funcionario', 'Renata Farias',        'Análise Financeira',      'financeiro', 1),
    ('agente',      'Agente de Cobrança',   'Cobrança',                'financeiro', 2),
    -- Marketing
    ('funcionario', 'Larissa Campos',       'Coordenação de Marketing','marketing',  0),
    ('funcionario', 'Pedro Igor Nunes',     'Social Media',            'marketing',  1),
    ('funcionario', 'Bruna Castelo',        'Design',                  'marketing',  2),
    ('agente',      'Agente de Conteúdo',   'Conteúdo',                'marketing',  3),
    -- Pedagógico
    ('funcionario', 'Patrícia Menezes',     'Coordenação Pedagógica',  'pedagogico', 0),
    ('funcionario', 'Carla Bittencourt',    'Instrutora',              'pedagogico', 1),
    ('funcionario', 'André Peixoto',        'Instrutor',               'pedagogico', 2),
    -- Eventos
    ('funcionario', 'Thiago Almeida',       'Coordenação de Eventos',  'eventos',    0),
    ('funcionario', 'Vanessa Lima',         'Produção',                'eventos',    1),
    -- Loja
    ('funcionario', 'Roberta Silveira',     'Gerência da Loja',        'loja',       0),
    ('funcionario', 'Aline Souza',          'Vendas',                  'loja',       1),
    ('agente',      'Agente de Atendimento','Atendimento',             'loja',       2),
    -- Estoque
    ('funcionario', 'Felipe Andrade',       'Análise de Estoque',      'estoque',    0),
    ('funcionario', 'Diego Martins',        'Auxiliar de Estoque',     'estoque',    1)
) AS v (tipo, nome, funcao, setor, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.org_membros);
