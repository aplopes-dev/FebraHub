-- ============================================================================
-- Agentes de IA (Fase 2/Etapa 3) — a ponte com a plataforma Aplopes AI,
-- portada do crm-aplopes (módulo teams) para tenant único. O motor de IA é
-- EXTERNO: aqui mora o pareamento (tokens cifrados AES-256-GCM com chave em
-- env, nunca em claro), o espelho das conversas e a idempotência do webhook.
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agentes_conexao (
  id                     smallint    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  workspace_id           text,
  workspace_nome         text,
  base_url               text,
  token_cifrado          text,
  webhook_secret_cifrado text,
  agente_padrao_id       text,
  agente_padrao_nome     text,
  status                 text        NOT NULL DEFAULT 'desconectado'
                         CHECK (status IN ('desconectado','pareado','erro')),
  -- Hash sha256 do token de conexão (fhk_live_…) que o admin cola no Aplopes;
  -- o manifesto/pair autenticam por ele. O token em claro nunca é guardado.
  token_conexao_hash     text,
  token_gerado_em        timestamptz,
  pareado_em             timestamptz,
  sincronizado_em        timestamptz,
  atualizado_em          timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.agentes_conexao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.agentes_conversas (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Idempotency-Key da criação remota; o webhook ecoa e o upsert casa aqui.
  ref_externa         text        NOT NULL,
  issue_remota_id     text,
  conversa_remota_id  text,
  titulo              text        NOT NULL,
  status              text        NOT NULL DEFAULT 'BACKLOG',
  agente_id           text,
  agente_nome         text,
  solicitante_id      uuid,
  solicitante_nome    text,
  tem_pendente        boolean     NOT NULL DEFAULT false,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now(),
  sincronizado_em     timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_agentes_conversa_ref ON public.agentes_conversas (ref_externa);
CREATE INDEX IF NOT EXISTS ix_agentes_conversa_atual ON public.agentes_conversas (atualizado_em DESC);

CREATE TABLE IF NOT EXISTS public.agentes_mensagens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id  uuid        NOT NULL REFERENCES public.agentes_conversas(id) ON DELETE CASCADE,
  autor        text        NOT NULL CHECK (autor IN ('usuario','agente')),
  conteudo     text        NOT NULL,
  agente_id    text,
  agente_nome  text,
  remoto_id    text,
  lida         boolean     NOT NULL DEFAULT false,
  criado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_agentes_msg_remota ON public.agentes_mensagens (conversa_id, remoto_id)
  WHERE remoto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_agentes_msg_conversa ON public.agentes_mensagens (conversa_id, criado_em);

-- Outbox de idempotência do webhook (evento remoto processado uma vez só).
CREATE TABLE IF NOT EXISTS public.agentes_eventos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_remoto_id text        NOT NULL,
  tipo             text        NOT NULL,
  processado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_agentes_evento ON public.agentes_eventos (evento_remoto_id);
