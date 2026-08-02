-- ============================================================================
-- Inbox completo do WhatsApp (porte integral da área de conversas do
-- crm-aplopes):
--  * atribuida_nome: nome denormalizado do responsável (a lista mostra sem
--    join; a FK lógica é atribuida_a, que já existia).
--  * citação nas mensagens: o WhatsApp entrega a referência da mensagem
--    respondida (stanzaId + trecho) — guardamos o suficiente para renderizar
--    a citação e rolar até a original quando ela existir localmente.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.wa_conversas
  ADD COLUMN IF NOT EXISTS atribuida_nome text;

ALTER TABLE public.wa_mensagens
  ADD COLUMN IF NOT EXISTS citacao_provider_id text,
  ADD COLUMN IF NOT EXISTS citacao_texto text,
  ADD COLUMN IF NOT EXISTS citacao_de_mim boolean;

CREATE INDEX IF NOT EXISTS ix_wa_conversa_status ON public.wa_conversas (status);
CREATE INDEX IF NOT EXISTS ix_wa_conversa_atribuida ON public.wa_conversas (atribuida_a);
