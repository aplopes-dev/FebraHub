-- ============================================================================
-- Conversas de agentes "ricas" — o que a página completa de conversas e o
-- kanban precisam além do espelho básico:
--
--  * prioridade / etiquetas / responsável: organização LOCAL do atendimento.
--    A plataforma remota não tem esses campos (verificado na origem) — eles
--    vivem só aqui e nunca são empurrados para o Aplopes.
--  * crm_cliente_id: vínculo da conversa com o cliente/lead do CRM (§31 da
--    spec) — SET NULL para a conversa sobreviver à limpeza do cliente.
--  * origem_contexto: rota do FebraHub de onde a conversa nasceu (o widget
--    manda — ex.: /territorial?sel=…), como o screenContext da origem.
--  * anexos_json nas mensagens: metadados dos artifacts remotos
--    [{artifactId, filename, contentType, size}] — o binário fica no
--    Aplopes, o download é proxy autenticado.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.agentes_conversas
  ADD COLUMN IF NOT EXISTS prioridade text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS etiquetas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS crm_cliente_id uuid,
  ADD COLUMN IF NOT EXISTS origem_contexto text;

DO $$ BEGIN
  ALTER TABLE public.agentes_conversas
    ADD CONSTRAINT ck_agentes_conversa_prioridade
    CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.agentes_conversas
    ADD CONSTRAINT fk_agentes_conversa_crm_cliente
    FOREIGN KEY (crm_cliente_id) REFERENCES public.crm_clientes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS ix_agentes_conversa_status ON public.agentes_conversas (status);
CREATE INDEX IF NOT EXISTS ix_agentes_conversa_responsavel ON public.agentes_conversas (responsavel_id);

ALTER TABLE public.agentes_mensagens
  ADD COLUMN IF NOT EXISTS anexos_json text;
