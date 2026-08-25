-- ====================================================================
-- FebraHub · Migration 41 — COMERCIAL CRM P0
--
-- Módulo Comercial integrado: pipeline de oportunidades, funil
-- configurável, vendas estruturadas, timeline 360°, negociação,
-- parcelas, integração Salesforce/Financeiro/Pedagógico.
--
-- Princípios de design:
--   - Pessoa Única: usa crm_clientes como entidade corporativa (já existe).
--     Novos campos e papéis adicionados sem quebrar o CRM atual.
--   - Sem FK hard para dim_* (dados legados inconsistentes).
--   - Dinheiro em CENTAVOS (bigint).
--   - UUIDs fixos nos dados-semente para idempotência.
--   - Eventos corporativos: VENDA_APROVADA, VENDA_CANCELADA, etc.
--     registrados em com_eventos_corporativos para consumo assíncrono.
--   - Auditoria completa: tabela dedicada por entidade relevante.
--   - Salesforce: IDs externos mapeados sem virar PK interna.
-- ====================================================================

-- ====================================================================
-- 1. com_funis  — funis comerciais configuráveis
--    Separado de crm_funis: comercial tem regras e tipos diferentes.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_funis (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  cor         TEXT        NOT NULL DEFAULT '#B8934A',
  -- vendas | relacionamento | pos_venda
  tipo        TEXT        NOT NULL DEFAULT 'vendas'
              CHECK (tipo IN ('vendas', 'relacionamento', 'pos_venda')),
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  criado_por  UUID,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 2. com_etapas — etapas de cada funil (configuráveis)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_etapas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id      UUID        NOT NULL REFERENCES public.com_funis(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  cor           TEXT        NOT NULL DEFAULT '#6B7280',
  -- aberta | ganha | perdida
  tipo          TEXT        NOT NULL DEFAULT 'aberta'
                CHECK (tipo IN ('aberta', 'ganha', 'perdida')),
  probabilidade INTEGER     NOT NULL DEFAULT 0 CHECK (probabilidade BETWEEN 0 AND 100),
  ordem         INTEGER     NOT NULL DEFAULT 0,
  -- etapa de sistema: nome/exclusão travados
  sistema       BOOLEAN     NOT NULL DEFAULT false,
  -- exige_motivo_perda: só tipo='perdida'
  exige_motivo  BOOLEAN     NOT NULL DEFAULT false,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_etapa_funil ON public.com_etapas (funil_id, ordem);

-- ====================================================================
-- 3. com_motivos_perda — catálogo configurável de motivos de perda
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_motivos_perda (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT        NOT NULL,
  ativo     BOOLEAN     NOT NULL DEFAULT true,
  ordem     INTEGER     NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 4. com_produtos — catálogo de produtos/serviços comerciais
--    Separado da loja (mercadorias): são treinamentos, cursos, coaching.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_produtos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT        UNIQUE,
  nome            TEXT        NOT NULL,
  descricao       TEXT,
  -- educacional | servico | outro
  tipo            TEXT        NOT NULL DEFAULT 'educacional'
                  CHECK (tipo IN ('educacional', 'servico', 'outro')),
  preco_centavos  BIGINT      NOT NULL DEFAULT 0,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  -- ID externo Salesforce (Product2.Id)
  sf_produto_id   TEXT        UNIQUE,
  -- FK fraca para dim_cursos.curso_id (dado legado)
  dim_curso_id    TEXT,
  criado_por      UUID,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_produto_tipo   ON public.com_produtos (tipo, ativo);
CREATE INDEX IF NOT EXISTS ix_com_produto_sf     ON public.com_produtos (sf_produto_id) WHERE sf_produto_id IS NOT NULL;

-- ====================================================================
-- 5. com_oportunidades — entidade central do pipeline comercial
--    Uma Pessoa pode ter múltiplas oportunidades ao longo do tempo.
--    Não duplicar: usar pessoa_id → crm_clientes.id
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_oportunidades (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pessoa (FK para crm_clientes — entidade corporativa única)
  pessoa_id           UUID        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE RESTRICT,

  -- Produto de interesse
  produto_id          UUID        REFERENCES public.com_produtos(id) ON DELETE SET NULL,
  produto_nome        TEXT,       -- desnormalizado para histórico

  -- Funil e etapa atuais
  funil_id            UUID        NOT NULL REFERENCES public.com_funis(id),
  etapa_id            UUID        NOT NULL REFERENCES public.com_etapas(id),

  -- Responsável comercial (consultor/vendedor/relacionadora)
  responsavel_id      UUID,       -- FK fraca: usuários/externos

  -- Unidade
  unidade             TEXT,

  -- Valor estimado em centavos
  valor_estimado_centavos BIGINT  DEFAULT 0,

  -- Probabilidade (0-100)
  probabilidade       INTEGER     DEFAULT 0 CHECK (probabilidade BETWEEN 0 AND 100),

  -- Rastreabilidade de origem
  origem              TEXT,       -- manual | salesforce | meta | google | sympla | whatsapp | evento | indicacao | importacao | landing_page | outro
  canal               TEXT,       -- whatsapp | instagram | email | ligacao | presencial | outro
  campanha            TEXT,
  evento_ref          TEXT,       -- ID ou nome do evento de origem
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_content         TEXT,
  utm_term            TEXT,

  -- Salesforce integration
  sf_oportunidade_id  TEXT        UNIQUE,
  sf_lead_id          TEXT,

  -- Datas
  data_prevista_fechamento DATE,
  ultima_interacao_em  TIMESTAMPTZ,
  proxima_acao_em      TIMESTAMPTZ,
  proxima_acao_descricao TEXT,
  fechada_em          TIMESTAMPTZ,

  -- Status e motivo de perda
  -- aberta | ganha | perdida | arquivada
  status              TEXT        NOT NULL DEFAULT 'aberta'
                      CHECK (status IN ('aberta', 'ganha', 'perdida', 'arquivada')),
  motivo_perda_id     UUID        REFERENCES public.com_motivos_perda(id) ON DELETE SET NULL,
  motivo_perda_texto  TEXT,

  -- Turma (quando produto educacional)
  -- NULL = ainda não escolheu; "a_definir" = explicitamente pendente
  turma_id            UUID,       -- FK fraca para pedagogico_turmas.id
  turma_a_definir     BOOLEAN     NOT NULL DEFAULT true,

  -- Observações e flags
  observacao          TEXT,
  tem_alerta          BOOLEAN     NOT NULL DEFAULT false,

  -- Auditoria
  criado_por          UUID,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_com_op_pessoa       ON public.com_oportunidades (pessoa_id);
CREATE INDEX IF NOT EXISTS ix_com_op_funil_etapa  ON public.com_oportunidades (funil_id, etapa_id);
CREATE INDEX IF NOT EXISTS ix_com_op_responsavel  ON public.com_oportunidades (responsavel_id);
CREATE INDEX IF NOT EXISTS ix_com_op_status       ON public.com_oportunidades (status, fechada_em);
CREATE INDEX IF NOT EXISTS ix_com_op_sf           ON public.com_oportunidades (sf_oportunidade_id) WHERE sf_oportunidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_com_op_proxima_acao ON public.com_oportunidades (proxima_acao_em) WHERE status = 'aberta';
CREATE INDEX IF NOT EXISTS ix_com_op_criado       ON public.com_oportunidades (criado_em DESC);

-- ====================================================================
-- 6. com_oportunidade_historico — timeline 360° da oportunidade
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_oportunidade_historico (
  id              BIGSERIAL   PRIMARY KEY,
  oportunidade_id UUID        NOT NULL REFERENCES public.com_oportunidades(id) ON DELETE CASCADE,

  -- lead_recebido | atribuido | etapa_mudou | interacao | proxima_acao
  -- nota | ligacao | whatsapp | email | reuniao | proposta | venda_criada
  -- venda_aprovada | venda_cancelada | perdida | reaberta | turma_definida
  -- transferencia_responsavel | sistema | salesforce
  tipo            TEXT        NOT NULL,
  titulo          TEXT,
  descricao       TEXT,

  -- Para mudança de etapa
  etapa_anterior  TEXT,
  etapa_nova      TEXT,

  -- Para transferência de responsável
  responsavel_anterior UUID,
  responsavel_novo     UUID,

  -- Valor anterior/novo (genérico para auditoria de campo)
  campo           TEXT,
  valor_anterior  TEXT,
  valor_novo      TEXT,

  -- Canal de comunicação (quando interação)
  canal           TEXT,

  -- Usuário ou sistema que gerou
  usuario_id      UUID,
  -- sistema | usuario | salesforce | webhook | automatico
  origem          TEXT        NOT NULL DEFAULT 'usuario',

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_hist_op      ON public.com_oportunidade_historico (oportunidade_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS ix_com_hist_tipo    ON public.com_oportunidade_historico (tipo, criado_em DESC);

-- ====================================================================
-- 7. com_responsavel_historico — trilha de transferências de responsável
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_responsavel_historico (
  id                  BIGSERIAL   PRIMARY KEY,
  oportunidade_id     UUID        NOT NULL REFERENCES public.com_oportunidades(id) ON DELETE CASCADE,
  responsavel_anterior UUID,
  responsavel_novo     UUID,
  alterado_por        UUID,
  motivo              TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_resp_hist_op ON public.com_responsavel_historico (oportunidade_id, criado_em DESC);

-- ====================================================================
-- 8. com_proximas_acoes — próximas ações (tarefas comerciais)
--    Vinculadas a oportunidade + pessoa + responsável.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_proximas_acoes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id UUID        NOT NULL REFERENCES public.com_oportunidades(id) ON DELETE CASCADE,
  pessoa_id       UUID        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE RESTRICT,
  responsavel_id  UUID,

  -- ligar | whatsapp | email | reuniao | proposta | follow_up | outro
  tipo            TEXT        NOT NULL DEFAULT 'follow_up'
                  CHECK (tipo IN ('ligar', 'whatsapp', 'email', 'reuniao', 'proposta', 'follow_up', 'outro')),
  titulo          TEXT        NOT NULL,
  descricao       TEXT,

  -- HOJE | ATRASADA | PROXIMA (calculado no app)
  vence_em        TIMESTAMPTZ NOT NULL,

  -- alta | media | baixa
  prioridade      TEXT        NOT NULL DEFAULT 'media'
                  CHECK (prioridade IN ('alta', 'media', 'baixa')),

  concluida_em    TIMESTAMPTZ,
  resultado       TEXT,

  criado_por      UUID,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_acao_op        ON public.com_proximas_acoes (oportunidade_id);
CREATE INDEX IF NOT EXISTS ix_com_acao_resp      ON public.com_proximas_acoes (responsavel_id, vence_em);
CREATE INDEX IF NOT EXISTS ix_com_acao_aberta    ON public.com_proximas_acoes (concluida_em, vence_em) WHERE concluida_em IS NULL;

-- ====================================================================
-- 9. com_negociacoes — condições comerciais da oportunidade em negociação
--    Uma negociação por oportunidade (1:1). Registra o deal completo.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_negociacoes (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id         UUID        UNIQUE NOT NULL REFERENCES public.com_oportunidades(id) ON DELETE CASCADE,

  produto_id              UUID        REFERENCES public.com_produtos(id) ON DELETE SET NULL,
  produto_nome            TEXT,
  quantidade              INTEGER     NOT NULL DEFAULT 1,

  -- Valores (centavos)
  preco_tabela_centavos   BIGINT      NOT NULL DEFAULT 0,
  desconto_centavos       BIGINT      NOT NULL DEFAULT 0,
  desconto_percentual     NUMERIC(5,2) DEFAULT 0,
  valor_negociado_centavos BIGINT     NOT NULL DEFAULT 0,
  entrada_centavos        BIGINT      NOT NULL DEFAULT 0,
  saldo_centavos          BIGINT      NOT NULL DEFAULT 0,

  -- Parcelamento
  num_parcelas            INTEGER     NOT NULL DEFAULT 1,
  valor_parcela_centavos  BIGINT      NOT NULL DEFAULT 0,

  -- Forma de pagamento
  -- pix | cartao_credito | cartao_debito | boleto | dinheiro | transferencia | cortesia | outro
  forma_pagamento         TEXT        NOT NULL DEFAULT 'pix'
                          CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'cortesia', 'outro')),

  -- Vencimentos das parcelas (array de datas ISO)
  vencimentos             JSONB       DEFAULT '[]',

  -- Condição especial e observações
  condicao_especial       TEXT,
  observacao              TEXT,

  -- Turma quando produto educacional
  turma_id                UUID,       -- FK fraca pedagogico_turmas
  turma_a_definir         BOOLEAN     NOT NULL DEFAULT true,

  -- Desconto aprovado por
  desconto_aprovado_por   UUID,
  desconto_aprovado_em    TIMESTAMPTZ,
  desconto_motivo         TEXT,

  -- Status da negociação
  -- rascunho | em_analise | aprovada | recusada
  status_aprovacao        TEXT        NOT NULL DEFAULT 'rascunho'
                          CHECK (status_aprovacao IN ('rascunho', 'em_analise', 'aprovada', 'recusada')),

  criado_por              UUID,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 10. com_vendas — entidade VENDA (negócio fechado)
--     Uma venda por oportunidade ganha. Imutável após aprovação.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_vendas (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Número sequencial humano (ex: VND-2026-0001)
  numero                  TEXT        UNIQUE NOT NULL,

  -- Vínculos
  oportunidade_id         UUID        UNIQUE REFERENCES public.com_oportunidades(id) ON DELETE RESTRICT,
  negociacao_id           UUID        UNIQUE REFERENCES public.com_negociacoes(id) ON DELETE RESTRICT,

  -- Comprador (quem paga)
  comprador_id            UUID        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE RESTRICT,

  -- Beneficiário (quem usa — pode ser diferente do comprador)
  beneficiario_id         UUID        REFERENCES public.crm_clientes(id) ON DELETE SET NULL,
  beneficiario_nome       TEXT,       -- desnormalizado (pode ser externo)

  -- Responsável comercial
  vendedor_id             UUID,
  relacionadora_id        UUID,
  unidade                 TEXT,

  -- Produto
  produto_id              UUID        REFERENCES public.com_produtos(id) ON DELETE SET NULL,
  produto_nome            TEXT        NOT NULL,
  quantidade              INTEGER     NOT NULL DEFAULT 1,

  -- Valores (centavos) — OBRIGATÓRIO guardar o valor integral
  preco_tabela_centavos   BIGINT      NOT NULL DEFAULT 0,
  desconto_centavos       BIGINT      NOT NULL DEFAULT 0,
  desconto_percentual     NUMERIC(5,2) DEFAULT 0,
  valor_negociado_centavos BIGINT     NOT NULL DEFAULT 0,  -- = valor total da venda
  entrada_centavos        BIGINT      NOT NULL DEFAULT 0,
  saldo_centavos          BIGINT      NOT NULL DEFAULT 0,

  -- Parcelamento
  num_parcelas            INTEGER     NOT NULL DEFAULT 1,
  valor_parcela_centavos  BIGINT      NOT NULL DEFAULT 0,
  forma_pagamento         TEXT        NOT NULL DEFAULT 'pix',
  vencimentos             JSONB       DEFAULT '[]',

  -- Turma
  turma_id                UUID,       -- FK fraca pedagogico_turmas
  turma_a_definir         BOOLEAN     NOT NULL DEFAULT true,

  -- Rastreabilidade
  origem                  TEXT,
  campanha                TEXT,
  evento_ref              TEXT,
  utm_source              TEXT,

  -- Status COMERCIAL (separado do financeiro)
  -- rascunho | aguardando_aprovacao | aprovada | cancelada
  status_comercial        TEXT        NOT NULL DEFAULT 'aguardando_aprovacao'
                          CHECK (status_comercial IN ('rascunho', 'aguardando_aprovacao', 'aprovada', 'cancelada')),

  -- Status FINANCEIRO (atualizado pelo módulo Financeiro)
  -- pendente | parcial | quitado | inadimplente | estornado
  status_financeiro       TEXT        NOT NULL DEFAULT 'pendente'
                          CHECK (status_financeiro IN ('pendente', 'parcial', 'quitado', 'inadimplente', 'estornado')),

  -- Aprovação
  aprovado_por            UUID,
  aprovado_em             TIMESTAMPTZ,

  -- Cancelamento
  cancelado_por           UUID,
  cancelado_em            TIMESTAMPTZ,
  motivo_cancelamento     TEXT,

  -- Salesforce
  sf_venda_id             TEXT        UNIQUE,
  sf_oportunidade_id      TEXT,

  -- Integração Financeiro (id do lançamento/receita gerado)
  financeiro_lancamento_id TEXT,

  -- Integração Pedagógico (id da matrícula gerada)
  pedagogico_matricula_id  UUID,

  -- Evento corporativo: foi disparado?
  evento_aprovada_em      TIMESTAMPTZ,   -- quando VENDA_APROVADA foi emitido
  evento_cancelada_em     TIMESTAMPTZ,   -- quando VENDA_CANCELADA foi emitido

  -- Observações
  condicao_especial       TEXT,
  observacao              TEXT,

  criado_por              UUID,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_com_venda_comprador   ON public.com_vendas (comprador_id);
CREATE INDEX IF NOT EXISTS ix_com_venda_beneficiario ON public.com_vendas (beneficiario_id) WHERE beneficiario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_com_venda_status      ON public.com_vendas (status_comercial, status_financeiro);
CREATE INDEX IF NOT EXISTS ix_com_venda_vendedor    ON public.com_vendas (vendedor_id);
CREATE INDEX IF NOT EXISTS ix_com_venda_op          ON public.com_vendas (oportunidade_id) WHERE oportunidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_com_venda_sf          ON public.com_vendas (sf_venda_id) WHERE sf_venda_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_com_venda_criado      ON public.com_vendas (criado_em DESC);
CREATE INDEX IF NOT EXISTS ix_com_venda_turma_ad    ON public.com_vendas (turma_a_definir) WHERE turma_a_definir = true AND status_comercial = 'aprovada';

-- ====================================================================
-- 11. com_venda_historico — auditoria completa da venda
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_venda_historico (
  id          BIGSERIAL   PRIMARY KEY,
  venda_id    UUID        NOT NULL REFERENCES public.com_vendas(id) ON DELETE CASCADE,
  -- criada | aprovada | cancelada | status_financeiro_mudou | turma_definida
  -- beneficiario_trocado | campo_editado | evento_disparado | salesforce_sync
  tipo        TEXT        NOT NULL,
  titulo      TEXT,
  descricao   TEXT,
  campo       TEXT,
  valor_anterior TEXT,
  valor_novo  TEXT,
  usuario_id  UUID,
  origem      TEXT        NOT NULL DEFAULT 'usuario',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_vhist_venda ON public.com_venda_historico (venda_id, criado_em DESC);

-- ====================================================================
-- 12. com_eventos_corporativos — fila de eventos para consumo assíncrono
--     VENDA_APROVADA → Financeiro + Pedagógico
--     VENDA_CANCELADA → Financeiro + Pedagógico + Comissão
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_eventos_corporativos (
  id              BIGSERIAL   PRIMARY KEY,

  -- LEAD_CRIADO | LEAD_ATRIBUIDO | OPORTUNIDADE_CRIADA | OPORTUNIDADE_GANHA
  -- OPORTUNIDADE_PERDIDA | VENDA_CRIADA | VENDA_APROVADA | VENDA_CANCELADA
  -- TURMA_DEFINIDA | PAGAMENTO_CONFIRMADO
  tipo            TEXT        NOT NULL,

  -- Payload estruturado do evento
  payload         JSONB       NOT NULL DEFAULT '{}',

  -- Idempotência: same tipo+referencia = mesmo evento
  referencia_id   TEXT        NOT NULL,  -- ex: venda_id, oportunidade_id
  referencia_tipo TEXT        NOT NULL,  -- ex: 'venda', 'oportunidade'

  -- Consumidores e seus estados: financeiro | pedagogico | salesforce | comissao
  consumidores    JSONB       NOT NULL DEFAULT '{}',
  -- Ex: {"financeiro": "pendente", "pedagogico": "processado"}

  -- pendente | processando | processado | erro | ignorado
  status          TEXT        NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'processando', 'processado', 'erro', 'ignorado')),

  tentativas      INTEGER     NOT NULL DEFAULT 0,
  erro_mensagem   TEXT,
  processado_em   TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_com_evento_ref
  ON public.com_eventos_corporativos (tipo, referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS ix_com_evento_status ON public.com_eventos_corporativos (status, tentativas);
CREATE INDEX IF NOT EXISTS ix_com_evento_tipo   ON public.com_eventos_corporativos (tipo, criado_em DESC);

-- ====================================================================
-- 13. com_salesforce_sync — mapeamento de IDs Salesforce ↔ ERP
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_salesforce_sync (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entidade interna
  -- pessoa | oportunidade | venda | produto | turma
  entidade_tipo   TEXT        NOT NULL,
  entidade_id     TEXT        NOT NULL,  -- UUID como texto (entidade interna)

  -- ID externo Salesforce
  sf_id           TEXT        NOT NULL,
  sf_objeto       TEXT,       -- Contact | Opportunity | Product2 | etc.

  -- Sincronização
  ultima_sync_em  TIMESTAMPTZ,
  -- erp_para_sf | sf_para_erp | bidirecional
  direcao         TEXT        NOT NULL DEFAULT 'sf_para_erp',
  -- ok | erro | pendente | conflito
  status          TEXT        NOT NULL DEFAULT 'ok',
  erro_mensagem   TEXT,
  sistema_origem  TEXT,       -- qual sistema foi a última fonte da verdade

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_com_sf_sync_entidade
  ON public.com_salesforce_sync (entidade_tipo, entidade_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_com_sf_sync_sfid
  ON public.com_salesforce_sync (sf_id, entidade_tipo);
CREATE INDEX IF NOT EXISTS ix_com_sf_sync_status ON public.com_salesforce_sync (status, ultima_sync_em);

-- ====================================================================
-- 14. com_carteiras — carteiras comerciais por responsável
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_carteiras (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT        NOT NULL,
  responsavel_id  UUID,       -- usuário responsável pela carteira
  -- consultor | relacionadora | gestor
  tipo_responsavel TEXT       NOT NULL DEFAULT 'consultor'
                   CHECK (tipo_responsavel IN ('consultor', 'relacionadora', 'gestor')),
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  descricao       TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_carteira_resp ON public.com_carteiras (responsavel_id);

-- ====================================================================
-- 15. com_metas — metas comerciais configuráveis
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_metas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- mes | trimestre | ano
  escopo          TEXT        NOT NULL DEFAULT 'mes'
                  CHECK (escopo IN ('mes', 'trimestre', 'ano')),
  competencia     DATE        NOT NULL,

  -- Alvo da meta (apenas um deve estar preenchido)
  usuario_id      UUID,       -- meta individual
  unidade         TEXT,       -- meta por unidade
  produto_id      UUID        REFERENCES public.com_produtos(id) ON DELETE SET NULL,

  -- Tipo de meta
  -- leads | oportunidades | vendas | valor_vendido | valor_recebido
  tipo_meta       TEXT        NOT NULL
                  CHECK (tipo_meta IN ('leads', 'oportunidades', 'vendas', 'valor_vendido', 'valor_recebido')),

  -- Valor da meta (centavos ou quantidade — depende do tipo)
  valor_centavos  BIGINT      NOT NULL DEFAULT 0,

  observacao      TEXT,
  criado_por      UUID,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_com_meta
  ON public.com_metas (escopo, competencia, tipo_meta, COALESCE(usuario_id::text, ''), COALESCE(unidade, ''), COALESCE(produto_id::text, ''));
CREATE INDEX IF NOT EXISTS ix_com_meta_usuario ON public.com_metas (usuario_id, competencia);
CREATE INDEX IF NOT EXISTS ix_com_meta_unidade ON public.com_metas (unidade, competencia);

-- ====================================================================
-- 16. com_leads_origem — rastreabilidade de entrada de leads
--     Captura a "pegada" de entrada preservando UTMs e canal.
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.com_leads_origem (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id       UUID        NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  oportunidade_id UUID        REFERENCES public.com_oportunidades(id) ON DELETE SET NULL,

  -- canal de entrada
  canal           TEXT        NOT NULL DEFAULT 'manual'
                  CHECK (canal IN ('salesforce', 'meta', 'google', 'whatsapp', 'instagram', 'manychat', 'sympla', 'palestra', 'evento', 'indicacao', 'formulario', 'importacao', 'manual', 'outro')),

  campanha        TEXT,
  evento_ref      TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,

  -- Dados do formulário/plataforma de origem
  dados_extras    JSONB       DEFAULT '{}',

  sf_lead_id      TEXT,       -- ID do Lead no Salesforce, se vier de lá

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_com_lead_orig_pessoa ON public.com_leads_origem (pessoa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS ix_com_lead_orig_canal  ON public.com_leads_origem (canal, criado_em DESC);
CREATE INDEX IF NOT EXISTS ix_com_lead_orig_sf     ON public.com_leads_origem (sf_lead_id) WHERE sf_lead_id IS NOT NULL;

-- ====================================================================
-- DADOS SEMENTE — UUIDs fixos para idempotência
-- ====================================================================

-- Funil principal de vendas
INSERT INTO public.com_funis (id, nome, descricao, cor, tipo, ativo, ordem)
VALUES (
  'f0000001-0000-4000-8000-000000000001',
  'Vendas FEBRACIS',
  'Pipeline principal de vendas — Lead → Venda',
  '#B8934A',
  'vendas',
  true,
  1
) ON CONFLICT (id) DO NOTHING;

-- Etapas do funil principal
INSERT INTO public.com_etapas (id, funil_id, nome, cor, probabilidade, tipo, ordem, sistema, exige_motivo)
VALUES
  ('e0000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000001', 'Novo Lead',    '#3B82F6', 5,   'aberta',  1, false, false),
  ('e0000001-0000-4000-8000-000000000002', 'f0000001-0000-4000-8000-000000000001', 'Primeiro Contato', '#06B6D4', 15, 'aberta', 2, false, false),
  ('e0000001-0000-4000-8000-000000000003', 'f0000001-0000-4000-8000-000000000001', 'Qualificado',  '#8B5CF6', 30,  'aberta',  3, false, false),
  ('e0000001-0000-4000-8000-000000000004', 'f0000001-0000-4000-8000-000000000001', 'Oportunidade', '#F59E0B', 50,  'aberta',  4, false, false),
  ('e0000001-0000-4000-8000-000000000005', 'f0000001-0000-4000-8000-000000000001', 'Negociação',   '#F97316', 75,  'aberta',  5, false, false),
  ('e0000001-0000-4000-8000-000000000006', 'f0000001-0000-4000-8000-000000000001', 'Venda',        '#17784A', 100, 'ganha',   6, true,  false),
  ('e0000001-0000-4000-8000-000000000007', 'f0000001-0000-4000-8000-000000000001', 'Perdido',      '#C0392B', 0,   'perdida', 7, true,  true)
ON CONFLICT (id) DO NOTHING;

-- Motivos de perda padrão
INSERT INTO public.com_motivos_perda (id, nome, ativo, ordem)
VALUES
  ('d0000001-0000-4000-8000-000000000001', 'Preço',                  true, 1),
  ('d0000001-0000-4000-8000-000000000002', 'Sem interesse',           true, 2),
  ('d0000001-0000-4000-8000-000000000003', 'Momento inadequado',      true, 3),
  ('d0000001-0000-4000-8000-000000000004', 'Não respondeu',           true, 4),
  ('d0000001-0000-4000-8000-000000000005', 'Concorrente',             true, 5),
  ('d0000001-0000-4000-8000-000000000006', 'Sem orçamento',           true, 6),
  ('d0000001-0000-4000-8000-000000000007', 'Produto inadequado',      true, 7),
  ('d0000001-0000-4000-8000-000000000008', 'Duplicidade',             true, 8),
  ('d0000001-0000-4000-8000-000000000009', 'Outro',                   true, 9)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEQUÊNCIA para numeração de vendas (VND-AAAA-NNNN)
-- ====================================================================
CREATE SEQUENCE IF NOT EXISTS public.com_venda_numero_seq START 1;

-- Função para gerar número de venda idempotente
CREATE OR REPLACE FUNCTION public.com_proximo_numero_venda()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  ano  TEXT := to_char(now(), 'YYYY');
  seq  BIGINT;
BEGIN
  SELECT nextval('public.com_venda_numero_seq') INTO seq;
  RETURN 'VND-' || ano || '-' || lpad(seq::text, 4, '0');
END;
$$;

COMMENT ON TABLE public.com_funis IS 'Funis comerciais configuráveis. Separado do crm_funis (pipeline B2B genérico).';
COMMENT ON TABLE public.com_oportunidades IS 'Pipeline comercial FEBRACIS. Uma Pessoa pode ter múltiplas oportunidades ao longo do tempo.';
COMMENT ON TABLE public.com_vendas IS 'Venda fechada. Status comercial ≠ status financeiro (PRD §24). Valor total negociado obrigatório (PRD §23).';
COMMENT ON TABLE public.com_eventos_corporativos IS 'Fila de eventos corporativos para integração assíncrona Financeiro/Pedagógico (PRD §27/54).';
