-- ============================================================================
-- Agenda da consolidação diária da memória institucional.
--
-- Antes o horário era fixo no código (4h05 America/Bahia). Agora a diretoria
-- escolhe na tela: hora do dia, fuso e se o cron está ligado. O padrão
-- preserva o comportamento antigo.
-- ============================================================================

ALTER TABLE public.brain_config
  ADD COLUMN IF NOT EXISTS consolidacao_ativa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS consolidacao_hora  text    NOT NULL DEFAULT '04:05',
  ADD COLUMN IF NOT EXISTS consolidacao_fuso  text    NOT NULL DEFAULT 'America/Bahia',
  ADD COLUMN IF NOT EXISTS ultima_consolidacao_em timestamptz;

UPDATE public.brain_config
SET consolidacao_ativa = true,
    consolidacao_hora = COALESCE(NULLIF(consolidacao_hora, ''), '04:05'),
    consolidacao_fuso = COALESCE(NULLIF(consolidacao_fuso, ''), 'America/Bahia')
WHERE id = 'brain';
