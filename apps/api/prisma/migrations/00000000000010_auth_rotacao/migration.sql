-- ============================================================================
-- Rotação de sessão com corrida benigna (padrão do Veicular).
--
-- `substituida_por`: id (jti) da sessão que sucedeu esta numa rotação
--   legítima — presente só quando a revogação veio de rotação; ausente em
--   revogação explícita (logout, troca de senha, reuso). É a trilha que
--   distingue "rodou" de "foi derrubada".
-- `absoluta_expira_em`: teto absoluto da sessão. Nasce no login e acompanha a
--   família nas rotações: o vencimento desliza a cada refresh, mas nunca
--   passa deste teto. Sessões antigas (null) ganham o teto na 1ª rotação.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.sessoes ADD COLUMN IF NOT EXISTS substituida_por text;
ALTER TABLE public.sessoes ADD COLUMN IF NOT EXISTS absoluta_expira_em timestamptz;
