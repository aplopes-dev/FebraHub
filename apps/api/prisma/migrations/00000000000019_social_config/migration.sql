-- ============================================================================
-- Integração com o Zernio (redes sociais).
--
-- Linha única, mesma decisão do brain_config: a chave fica CIFRADA aqui e não
-- numa variável de ambiente. Quem a troca é a diretoria pela tela — variável
-- de ambiente exigiria deploy, e a chave do Zernio expira/rotaciona sozinha
-- com muito mais frequência do que o sistema é implantado.
--
-- `perfil_zernio` é o profile (workspace) do Zernio quando a conta tem mais de
-- um; nulo significa "todos". `conta_anuncio` é a conta de anúncios padrão do
-- painel de campanhas (act_<n> no Meta) — evita escolher no seletor a cada
-- abertura da tela.
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.social_config (
  id             text        PRIMARY KEY DEFAULT 'social',
  chave_zernio   text,
  perfil_zernio  text,
  conta_anuncio  text,
  fuso           text        NOT NULL DEFAULT 'America/Bahia',
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);

INSERT INTO public.social_config (id) VALUES ('social') ON CONFLICT (id) DO NOTHING;
