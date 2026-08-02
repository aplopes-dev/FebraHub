-- ============================================================================
-- WhatsApp (Fase 2/Etapa 2) — porte do crm-aplopes achatado para tenant único:
-- UMA conexão (linha única), conversas chaveadas pelo telefone e mensagens com
-- mídia re-hospedada no MinIO. O socket Baileys roda no processo da API, como
-- na origem em produção (débito assumido e documentado); a sessão fica em
-- volume próprio. Referências de usuário são uuid soltos. Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wa_conexao (
  id              smallint    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status          text        NOT NULL DEFAULT 'desconectado'
                  CHECK (status IN ('desconectado','conectando','qr_pendente','conectado','erro')),
  telefone        text,
  nome_exibicao   text,
  qr_code         text,
  qr_gerado_em    timestamptz,
  conectado_em    timestamptz,
  desconectado_em timestamptz,
  ultimo_erro     text,
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.wa_conexao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.wa_conversas (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           text        NOT NULL DEFAULT 'direta' CHECK (tipo IN ('direta','grupo')),
  -- Chave natural da conversa direta: o telefone normalizado (só dígitos).
  telefone       text        NOT NULL,
  jid            text,
  nome_contato   text,
  crm_cliente_id uuid        REFERENCES public.crm_clientes(id) ON DELETE SET NULL,
  atribuida_a    uuid,
  status         text        NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','pendente','fechada')),
  nao_lidas      int         NOT NULL DEFAULT 0,
  ultima_msg     text,
  ultima_msg_em  timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  excluida_em    timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wa_conversa_telefone ON public.wa_conversas (telefone);
CREATE INDEX IF NOT EXISTS ix_wa_conversa_ultima ON public.wa_conversas (ultima_msg_em DESC);
CREATE INDEX IF NOT EXISTS ix_wa_conversa_cliente ON public.wa_conversas (crm_cliente_id);

CREATE TABLE IF NOT EXISTS public.wa_mensagens (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id         uuid        NOT NULL REFERENCES public.wa_conversas(id) ON DELETE CASCADE,
  direcao             text        NOT NULL CHECK (direcao IN ('entrada','saida')),
  tipo_remetente      text        NOT NULL DEFAULT 'contato' CHECK (tipo_remetente IN ('contato','operador','sistema')),
  operador_id         uuid,
  tipo_conteudo       text        NOT NULL DEFAULT 'texto'
                      CHECK (tipo_conteudo IN ('texto','imagem','video','audio','documento','figurinha','desconhecido')),
  texto               text,
  midia_chave         text,
  midia_nome          text,
  midia_mime          text,
  midia_tamanho       int,
  midia_nota_voz      boolean     NOT NULL DEFAULT false,
  -- key.id do Baileys — a chave da deduplicação (eco do próprio envio,
  -- reentrega e mensagem enviada pelo celular chegam todas por aqui).
  provider_message_id text,
  remote_jid          text,
  de_mim              boolean     NOT NULL DEFAULT false,
  status              text        NOT NULL DEFAULT 'enviada'
                      CHECK (status IN ('enviando','enviada','entregue','lida','falhou')),
  erro                text,
  criado_em           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wa_msg_provider ON public.wa_mensagens (provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_wa_msg_conversa ON public.wa_mensagens (conversa_id, criado_em);
