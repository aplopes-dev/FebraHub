-- ============================================================================
-- Motor de resposta da memória institucional.
--
-- Linha única. A chave do provedor fica cifrada aqui e não numa variável de
-- ambiente: quem troca é a diretoria pela tela, e variável exigiria deploy.
-- Sem chave, a síntese usa o modelo local da VPS (grátis e lento).
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brain_config (
  id             text        PRIMARY KEY DEFAULT 'brain',
  chave_openai   text,
  modelo         text        NOT NULL DEFAULT 'gpt-4o-mini',
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);

INSERT INTO public.brain_config (id) VALUES ('brain') ON CONFLICT (id) DO NOTHING;
