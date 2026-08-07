-- ============================================================================
-- CRM — núcleo (Fase 2/Etapa 1 da integração; docs/INTEGRACAO_HUB_CRM.md)
--
-- Porte FUNCIONAL do crm-aplopes achatado para tenant único (decisão de
-- 02/08/2026): sem organizationId, sem memberships — o recorte é o setor
-- 'crm' do FebraHub, e papéis granulares da origem viram a regra da casa
-- (setor = usa; admin/gestor = configura). A carga inicial é VAZIA por
-- decisão explícita (as carteiras da origem pertencem a outras empresas);
-- por isso as tabelas seguem a convenção pt-BR do FebraHub, sem compromisso
-- de restore byte a byte.
--
-- Referências de usuário são uuid SOLTOS (padrão do projeto): a trilha
-- sobrevive ao usuário, e nenhuma FK aponta para `usuarios`.
-- Dinheiro em CENTAVOS (inteiro), como na origem.
-- Idempotente, como as demais.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_clientes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           text        NOT NULL,
  -- 'pj' | 'pf'
  tipo_pessoa    varchar(2)  NOT NULL DEFAULT 'pj',
  -- Ciclo de vida da origem: lead → oportunidade → cliente_ativo | inativo | perdido.
  -- "Leads" é este mesmo cadastro filtrado por estágio, como no sistema de origem.
  estagio        text        NOT NULL DEFAULT 'lead'
                 CHECK (estagio IN ('lead', 'oportunidade', 'cliente_ativo', 'inativo', 'perdido')),
  documento      text,
  segmento       text,
  origem         text,
  telefone       text,
  email          text,
  site           text,
  instagram      text,
  cidade         text,
  observacao     text,
  responsavel_id uuid,
  criado_por     uuid,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_cliente_documento
  ON public.crm_clientes (documento) WHERE documento IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_crm_cliente_estagio ON public.crm_clientes (estagio);
CREATE INDEX IF NOT EXISTS ix_crm_cliente_nome ON public.crm_clientes (nome);
CREATE INDEX IF NOT EXISTS ix_crm_cliente_responsavel ON public.crm_clientes (responsavel_id);

CREATE TABLE IF NOT EXISTS public.crm_cliente_contatos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  nome       text        NOT NULL,
  cargo      text,
  email      text,
  telefone   text,
  principal  boolean     NOT NULL DEFAULT false,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_contato_cliente ON public.crm_cliente_contatos (cliente_id);

CREATE TABLE IF NOT EXISTS public.crm_cliente_atividades (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  texto      text        NOT NULL,
  autor_id   uuid,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_cli_atividade ON public.crm_cliente_atividades (cliente_id, criado_em);

CREATE TABLE IF NOT EXISTS public.crm_funis (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      text        NOT NULL,
  cor       text,
  status    text        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_etapas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id      uuid        NOT NULL REFERENCES public.crm_funis(id) ON DELETE CASCADE,
  nome          text        NOT NULL,
  cor           text,
  probabilidade int         NOT NULL DEFAULT 0,
  -- 'aberta' | 'ganha' | 'perdida' — mover para ganha/perdida fecha o negócio.
  tipo          text        NOT NULL DEFAULT 'aberta' CHECK (tipo IN ('aberta', 'ganha', 'perdida')),
  ordem         int         NOT NULL DEFAULT 0,
  sistema       boolean     NOT NULL DEFAULT false,
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_etapa_funil ON public.crm_etapas (funil_id, ordem);

CREATE TABLE IF NOT EXISTS public.crm_negocios (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id            uuid        NOT NULL REFERENCES public.crm_funis(id),
  etapa_id            uuid        NOT NULL REFERENCES public.crm_etapas(id),
  cliente_id          uuid        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE RESTRICT,
  contato_id          uuid        REFERENCES public.crm_cliente_contatos(id) ON DELETE SET NULL,
  titulo              text        NOT NULL,
  valor_centavos      bigint      NOT NULL DEFAULT 0,
  responsavel_id      uuid,
  motivo_perda        text,
  ultima_atividade_em timestamptz,
  fechado_em          timestamptz,
  criado_por          uuid,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_negocio_funil_etapa ON public.crm_negocios (funil_id, etapa_id);
CREATE INDEX IF NOT EXISTS ix_crm_negocio_cliente ON public.crm_negocios (cliente_id);
CREATE INDEX IF NOT EXISTS ix_crm_negocio_responsavel ON public.crm_negocios (responsavel_id);

CREATE TABLE IF NOT EXISTS public.crm_negocio_atividades (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid        NOT NULL REFERENCES public.crm_negocios(id) ON DELETE CASCADE,
  tipo       text        NOT NULL DEFAULT 'nota'
             CHECK (tipo IN ('nota', 'ligacao', 'email', 'whatsapp', 'estagio', 'tarefa', 'criado', 'atualizado')),
  texto      text        NOT NULL,
  autor_id   uuid,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_neg_atividade ON public.crm_negocio_atividades (negocio_id, criado_em);

CREATE TABLE IF NOT EXISTS public.crm_tarefas (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Melhoria sobre a origem (lá o vínculo era só com negócio): tarefa pode
  -- pendurar em negócio E/OU cliente, ambos opcionais.
  negocio_id     uuid        REFERENCES public.crm_negocios(id) ON DELETE SET NULL,
  cliente_id     uuid        REFERENCES public.crm_clientes(id) ON DELETE SET NULL,
  titulo         text        NOT NULL,
  tipo           text        NOT NULL DEFAULT 'follow_up' CHECK (tipo IN ('ligacao', 'reuniao', 'follow_up')),
  prioridade     text        NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  vence_em       timestamptz,
  concluida_em   timestamptz,
  resultado      text,
  responsavel_id uuid,
  criado_por     uuid,
  criado_em      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_crm_tarefa_aberta ON public.crm_tarefas (concluida_em, vence_em);
CREATE INDEX IF NOT EXISTS ix_crm_tarefa_negocio ON public.crm_tarefas (negocio_id);
CREATE INDEX IF NOT EXISTS ix_crm_tarefa_cliente ON public.crm_tarefas (cliente_id);

-- ----------------------------------------------------------------------------
-- Funil padrão de vendas (mesma escada do sistema de origem). UUIDs fixos
-- para a migration poder rodar de novo sem duplicar.
-- ----------------------------------------------------------------------------
INSERT INTO public.crm_funis (id, nome, cor, status) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Vendas', '#B8934A', 'ativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crm_etapas (id, funil_id, nome, cor, probabilidade, tipo, ordem, sistema) VALUES
  ('c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000001', 'Prospecção',  '#3b82f6', 10,  'aberta',  1, false),
  ('c0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000001', 'Qualificação','#22d3ee', 25,  'aberta',  2, false),
  ('c0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000001', 'Proposta',    '#facc15', 50,  'aberta',  3, false),
  ('c0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000001', 'Negociação',  '#fb923c', 75,  'aberta',  4, false),
  ('c0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000001', 'Ganho',       '#17784A', 100, 'ganha',   5, true),
  ('c0000000-0000-4000-8000-000000000016', 'c0000000-0000-4000-8000-000000000001', 'Perdido',     '#C0392B', 0,   'perdida', 6, true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.crm_clientes IS
  'CRM tenant único (Fase 2/Etapa 1). Nasceu vazio por decisão de 02/08/2026 — as carteiras do crm-aplopes pertencem a outras empresas.';
