-- ====================================================================
-- FebraHub · Migration 52 — INSTAGRAM (login direto via aiograpi-rest)
--
-- Conta do Instagram conectada por login direto (API privada), separada da
-- integração Zernio (social_config). Cobre DMs, publicações, stories, perfis
-- e insights da conta oficial, usada dentro da aba Marketing.
--
-- Uma linha única (id='instagram'): a conta é uma só, da Febracis Salvador.
-- `dados` guarda TODO o estado da sessão (usuário, senha, sessionId, status,
-- desafio pendente) serializado em JSON e cifrado (AES-256-GCM, chave dos
-- agentes) — nunca em texto claro.
--
-- Sidecar: variável de ambiente ALOOK_AIOGRAPI_URL (URL interna do serviço
-- aiograpi-rest, sem barra final). Sem ela, a integração fica indisponível.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.instagram_config (
  id             TEXT        PRIMARY KEY DEFAULT 'instagram',
  -- JSON do InstagramConfig, cifrado. Nulo = não conectado.
  dados          TEXT,
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID
);

COMMENT ON TABLE public.instagram_config IS 'Sessão do Instagram conectada por login direto (aiograpi-rest). Linha única id=instagram; dados cifrados (AES-256-GCM).';
