-- ====================================================================
-- FebraHub · Migration 40 — PEDAGOGICO P0
--
-- Módulo Pedagógico: gestão operacional de turmas, matrículas, confirmações,
-- credenciamentos, presenças, transferências, monitores, políticas de
-- validade, integração com Salesforce, solicitações e Customer Success.
--
-- Regras de design:
--   - Sem FK hard para dim_alunos / dim_turmas (dados legados Supabase, sem
--     PK com constraint — FK fraca via campo + índice).
--   - pessoa_id em pedagogico_matriculas aceita UUID (crm_clientes) ou string
--     (aluno_id do dim_alunos): transição intencional do ERP.
--   - Todas as PKs novas são UUID geradas pelo Postgres (gen_random_uuid()).
--   - Todos os timestamps são TIMESTAMPTZ.
--   - UNIQUE em pedagogico_integracao_logs(sistema_origem, evento, id_externo)
--     garante idempotência de processamento.
--   - UNIQUE em pedagogico_credenciamentos(matricula_id) impede duplo check-in.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. pedagogico_turmas
--    Turma operacional do Pedagógico — gerenciada pelo ERP, não só
--    lida passivamente do Salesforce. É a entidade central do módulo.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_turmas" (
  "id"                      UUID        NOT NULL DEFAULT gen_random_uuid(),
  -- ID Salesforce para idempotência de sync; nullable pois pode ser criada aqui
  "turma_id_sf"             TEXT        NULL,
  -- FK fraca para dim_turmas.turma_id (sem constraint, dados legados inconsistentes)
  "dim_turma_id"            TEXT        NULL,
  -- FK fraca para dim_cursos.curso_id
  "curso_id"                TEXT        NULL,
  "nome"                    TEXT        NOT NULL,
  "curso_nome"              TEXT        NOT NULL,
  "unidade"                 TEXT        NULL,
  "local"                   TEXT        NULL,
  "endereco"                TEXT        NULL,
  "data_inicio"             DATE        NULL,
  "data_fim"                DATE        NULL,
  "horario_inicio"          TEXT        NULL,
  "horario_fim"             TEXT        NULL,
  "horario_credenciamento"  TEXT        NULL,
  "treinador"               TEXT        NULL,
  -- FK fraca para usuarios.id (sem constraint — responsável pode ser externo)
  "responsavel_id"          UUID        NULL,
  "capacidade"              INTEGER     NULL DEFAULT 30,
  -- Planejada|Aguardando Validação|Confirmada|Em Preparação|Em Andamento|Finalizada|Cancelada
  "status"                  TEXT        NOT NULL DEFAULT 'Planejada',
  "link_grupo"              TEXT        NULL,
  "link_externo"            TEXT        NULL,
  "sigla"                   TEXT        NULL,
  "ano_fiscal"              INTEGER     NULL,
  "observacoes"             TEXT        NULL,
  "criado_por"              UUID        NULL,
  "criado_em"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "pedagogico_turmas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pedagogico_turmas_turma_id_sf_key"
  ON "pedagogico_turmas" ("turma_id_sf")
  WHERE "turma_id_sf" IS NOT NULL;

-- Índices de suporte para filtros comuns de listagem
CREATE INDEX "pedagogico_turmas_status_data_inicio_idx"
  ON "pedagogico_turmas" ("status", "data_inicio");
CREATE INDEX "pedagogico_turmas_unidade_status_idx"
  ON "pedagogico_turmas" ("unidade", "status");
CREATE INDEX "pedagogico_turmas_dim_turma_id_idx"
  ON "pedagogico_turmas" ("dim_turma_id");
CREATE INDEX "pedagogico_turmas_curso_id_idx"
  ON "pedagogico_turmas" ("curso_id");

-- --------------------------------------------------------------------
-- 2. pedagogico_matriculas
--    Vínculo acadêmico: Pessoa ↔ Turma.
--    pessoa_id é TEXT (FK fraca) pois aceita UUID do crm_clientes OU
--    aluno_id string do dim_alunos — ERP em transição.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_matriculas" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),

  -- Identificação da pessoa (FK fraca, campo desnormalizado para queries rápidas)
  "pessoa_id"        TEXT        NOT NULL,
  "pessoa_nome"      TEXT        NULL,
  "pessoa_cpf"       TEXT        NULL,
  "pessoa_email"     TEXT        NULL,
  "pessoa_telefone"  TEXT        NULL,

  -- Vínculo com turma (FK hard — turma deve existir)
  "turma_id"         UUID        NOT NULL,

  -- Origem comercial
  "matricula_sf_id"  TEXT        NULL,   -- ID Salesforce (idempotência)
  "venda_id"         TEXT        NULL,   -- ID da venda (SF ou interno)
  "curso_id"         TEXT        NULL,   -- FK fraca dim_cursos
  "curso_nome"       TEXT        NULL,   -- desnormalizado

  -- Datas
  "data_compra"      DATE        NULL,
  "data_matricula"   DATE        NULL DEFAULT CURRENT_DATE,
  "validade_inicio"  DATE        NULL,
  "validade_fim"     DATE        NULL,
  "data_conclusao"   DATE        NULL,

  -- Status da jornada acadêmica
  -- Matriculado|Aguardando Contato|Aguardando Resposta|Confirmado|Não Respondeu|
  -- Próxima Turma|Transferência Solicitada|Transferência Pendente|Transferido|
  -- Cancelamento Solicitado|Cancelado|Credenciado|Em Curso|Concluído|Faltou|Represado
  "status"           TEXT        NOT NULL DEFAULT 'Matriculado',

  -- Origem do registro
  "origem"           TEXT        NULL DEFAULT 'manual', -- salesforce|manual|portal|importacao
  "unidade"          TEXT        NULL,
  "vendedor"         TEXT        NULL,

  -- Auditoria
  "criado_por"       UUID        NULL,
  "criado_em"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_matriculas_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_mat_turma"              FOREIGN KEY ("turma_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "pedagogico_matriculas_matricula_sf_id_key"
  ON "pedagogico_matriculas" ("matricula_sf_id")
  WHERE "matricula_sf_id" IS NOT NULL;

CREATE INDEX "pedagogico_matriculas_pessoa_id_idx"     ON "pedagogico_matriculas" ("pessoa_id");
CREATE INDEX "pedagogico_matriculas_turma_id_idx"      ON "pedagogico_matriculas" ("turma_id");
CREATE INDEX "pedagogico_matriculas_status_idx"        ON "pedagogico_matriculas" ("status");
CREATE INDEX "pedagogico_matriculas_pessoa_status_idx" ON "pedagogico_matriculas" ("pessoa_id", "status");

-- --------------------------------------------------------------------
-- 3. pedagogico_matricula_historico
--    Timeline de cada matrícula — toda mudança de estado, contato ou
--    evento relevante produz uma linha aqui.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_matricula_historico" (
  "id"             BIGSERIAL   NOT NULL,
  "matricula_id"   UUID        NOT NULL,
  -- status_mudou|venda_aprovada|matricula_criada|confirmado|nao_respondeu|
  -- credenciado|presenca|transferencia|cancelamento|conclusao|certificado|
  -- contato_registrado|observacao
  "tipo"           TEXT        NOT NULL,
  "descricao"      TEXT        NULL,
  "valor_anterior" TEXT        NULL,
  "valor_novo"     TEXT        NULL,
  "usuario_id"     UUID        NULL,
  "origem"         TEXT        NULL DEFAULT 'sistema', -- sistema|usuario|integracao|webhook
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_matricula_historico_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_hist_matricula"               FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE CASCADE
);

CREATE INDEX "pedagogico_matricula_historico_matricula_criado_idx"
  ON "pedagogico_matricula_historico" ("matricula_id", "criado_em" DESC);

-- --------------------------------------------------------------------
-- 4. pedagogico_confirmacoes
--    Registro de cada tentativa de contato para confirmar participação
--    em uma turma. Canal pode ser whatsapp, e-mail, ligação ou manual.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_confirmacoes" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"   UUID        NOT NULL,
  -- whatsapp|email|ligacao|manual
  "canal"          TEXT        NOT NULL DEFAULT 'whatsapp',
  -- enviado|entregue|lido|respondido|confirmado|nao_respondeu|invalido|erro
  "status"         TEXT        NOT NULL DEFAULT 'enviado',
  "mensagem"       TEXT        NULL,
  "template_tipo"  TEXT        NULL,
  "usuario_id"     UUID        NULL,
  "resposta"       TEXT        NULL,
  "respondido_em"  TIMESTAMPTZ NULL,
  "tentativa_num"  INTEGER     NOT NULL DEFAULT 1,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_confirmacoes_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_conf_matricula"                FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE CASCADE
);

CREATE INDEX "pedagogico_confirmacoes_matricula_idx" ON "pedagogico_confirmacoes" ("matricula_id");
CREATE INDEX "pedagogico_confirmacoes_status_idx"    ON "pedagogico_confirmacoes" ("status");

-- --------------------------------------------------------------------
-- 5. pedagogico_credenciamentos
--    Check-in do aluno no evento. Mais granular que fato_credenciamento
--    (legado). UNIQUE em matricula_id impede duplo credenciamento.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_credenciamentos" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"   UUID        NOT NULL,
  "turma_id"       UUID        NOT NULL,
  -- FK fraca para dim_alunos.aluno_id ou crm_clientes.id
  "pessoa_id"      TEXT        NOT NULL,
  -- credenciamento|recredenciamento
  "tipo"           TEXT        NOT NULL DEFAULT 'credenciamento',
  "dispositivo"    TEXT        NULL,
  "usuario_id"     UUID        NULL,
  "observacoes"    TEXT        NULL,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_credenciamentos_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "pedagogico_credenciamentos_mat_key"   UNIQUE ("matricula_id"),
  CONSTRAINT "fk_ped_cred_matricula"                FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_ped_cred_turma"                   FOREIGN KEY ("turma_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE RESTRICT
);

CREATE INDEX "pedagogico_credenciamentos_turma_idx" ON "pedagogico_credenciamentos" ("turma_id");

-- --------------------------------------------------------------------
-- 6. pedagogico_presencas
--    Presença por aluno + turma + dia + sessão.
--    UNIQUE(matricula_id, dia_num, sessao) impede duplicidade de registro.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_presencas" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"   UUID        NOT NULL,
  "turma_id"       UUID        NOT NULL,
  -- FK fraca
  "pessoa_id"      TEXT        NOT NULL,
  "dia_num"        INTEGER     NOT NULL DEFAULT 1,   -- Dia 1, Dia 2, etc.
  -- geral|manha|tarde|noite
  "sessao"         TEXT        NOT NULL DEFAULT 'geral',
  -- presente|ausente|justificado|atrasado
  "status"         TEXT        NOT NULL DEFAULT 'presente',
  "entrada_em"     TIMESTAMPTZ NULL,
  "dispositivo"    TEXT        NULL,
  "usuario_id"     UUID        NULL,
  "observacoes"    TEXT        NULL,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_presencas_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "pedagogico_presencas_mat_dia_sess_key" UNIQUE ("matricula_id", "dia_num", "sessao"),
  CONSTRAINT "fk_ped_pres_matricula"                FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_ped_pres_turma"                   FOREIGN KEY ("turma_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE RESTRICT
);

CREATE INDEX "pedagogico_presencas_turma_idx"     ON "pedagogico_presencas" ("turma_id");
CREATE INDEX "pedagogico_presencas_matricula_idx" ON "pedagogico_presencas" ("matricula_id");

-- --------------------------------------------------------------------
-- 7. pedagogico_transferencias
--    Histórico de transferências de turma. Suporta os status completos
--    do fluxo: solicitada → aprovada → efetivada (ou cancelada).
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_transferencias" (
  "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"     UUID           NOT NULL,
  "turma_origem_id"  UUID           NOT NULL,
  "turma_destino_id" UUID           NULL,
  "motivo"           TEXT           NULL,
  -- solicitada|aprovada|efetivada|cancelada
  "status"           TEXT           NOT NULL DEFAULT 'solicitada',
  "taxa_cobrada"     BOOLEAN        NOT NULL DEFAULT FALSE,
  "valor_taxa"       NUMERIC(10,2)  NULL,
  "pagamento_id"     TEXT           NULL,
  "usuario_id"       UUID           NULL,
  "aprovado_por"     UUID           NULL,
  "observacoes"      TEXT           NULL,
  "criado_em"        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "atualizado_em"    TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_transferencias_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_transf_matricula"                 FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_ped_transf_turma_origem"              FOREIGN KEY ("turma_origem_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_ped_transf_turma_destino"             FOREIGN KEY ("turma_destino_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE SET NULL
);

CREATE INDEX "pedagogico_transferencias_matricula_idx" ON "pedagogico_transferencias" ("matricula_id");
CREATE INDEX "pedagogico_transferencias_status_idx"    ON "pedagogico_transferencias" ("status");

-- --------------------------------------------------------------------
-- 8. pedagogico_monitores
--    Vínculo de monitor (pessoa da equipe) com cursos/turmas.
--    pessoa_id é FK fraca (pode ser crm_clientes.id ou dim_alunos.aluno_id).
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_monitores" (
  "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  -- FK para usuarios.id com SET NULL para preservar histórico
  "usuario_id"          UUID        NULL,
  -- FK fraca para crm_clientes.id ou dim_alunos.aluno_id
  "pessoa_id"           TEXT        NOT NULL,
  "nome"                TEXT        NOT NULL,
  "email"               TEXT        NULL,
  "telefone"            TEXT        NULL,
  -- ativo|inativo|suspenso
  "status"              TEXT        NOT NULL DEFAULT 'ativo',
  -- Array de curso_id ou nomes de cursos habilitados para este monitor
  "cursos_habilitados"  TEXT[]      NOT NULL DEFAULT '{}',
  "observacoes"         TEXT        NULL,
  "criado_em"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_monitores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_mon_usuario"        FOREIGN KEY ("usuario_id")
    REFERENCES "usuarios" ("id") ON DELETE SET NULL
);

CREATE INDEX "pedagogico_monitores_usuario_idx"  ON "pedagogico_monitores" ("usuario_id");
CREATE INDEX "pedagogico_monitores_pessoa_idx"   ON "pedagogico_monitores" ("pessoa_id");
CREATE INDEX "pedagogico_monitores_status_idx"   ON "pedagogico_monitores" ("status");

-- --------------------------------------------------------------------
-- 9. pedagogico_escalas
--    Escala de monitor em uma turma.
--    UNIQUE(turma_id, monitor_id) impede escala duplicada.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_escalas" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "turma_id"     UUID        NOT NULL,
  "monitor_id"   UUID        NOT NULL,
  -- monitor|lider|apoio
  "funcao"       TEXT        NULL DEFAULT 'monitor',
  "data_inicio"  DATE        NULL,
  "data_fim"     DATE        NULL,
  "horario"      TEXT        NULL,
  "kit_entregue" BOOLEAN     NOT NULL DEFAULT FALSE,
  "observacoes"  TEXT        NULL,
  "criado_em"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_escalas_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "pedagogico_escalas_turma_mon_key"  UNIQUE ("turma_id", "monitor_id"),
  CONSTRAINT "fk_ped_esc_turma"                  FOREIGN KEY ("turma_id")
    REFERENCES "pedagogico_turmas" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_ped_esc_monitor"                FOREIGN KEY ("monitor_id")
    REFERENCES "pedagogico_monitores" ("id") ON DELETE CASCADE
);

CREATE INDEX "pedagogico_escalas_turma_idx"   ON "pedagogico_escalas" ("turma_id");
CREATE INDEX "pedagogico_escalas_monitor_idx" ON "pedagogico_escalas" ("monitor_id");

-- --------------------------------------------------------------------
-- 10. pedagogico_politicas
--     Configurações de validade e regras por curso.
--     UNIQUE em curso_id garante uma política por curso.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_politicas" (
  "id"                    UUID           NOT NULL DEFAULT gen_random_uuid(),
  -- FK fraca para dim_cursos.curso_id ou nome de curso
  "curso_id"              TEXT           NOT NULL,
  "curso_nome"            TEXT           NOT NULL,
  "validade_quantidade"   INTEGER        NOT NULL DEFAULT 12,
  -- dias|meses
  "validade_unidade"      TEXT           NOT NULL DEFAULT 'meses',
  -- data_compra|data_matricula|data_conclusao
  "validade_regra"        TEXT           NOT NULL DEFAULT 'data_compra',
  "tolerancia_dias"       INTEGER        NOT NULL DEFAULT 0,
  "presenca_minima_pct"   NUMERIC(5,2)   NULL DEFAULT 75,
  "taxa_transferencia"    NUMERIC(10,2)  NULL DEFAULT 200.00,
  "permite_transferencia" BOOLEAN        NOT NULL DEFAULT TRUE,
  "max_transferencias"    INTEGER        NULL DEFAULT 2,
  "ativo"                 BOOLEAN        NOT NULL DEFAULT TRUE,
  "criado_por"            UUID           NULL,
  "criado_em"             TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "atualizado_em"         TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_politicas_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "pedagogico_politicas_curso_id_key" UNIQUE ("curso_id")
);

CREATE INDEX "pedagogico_politicas_ativo_idx" ON "pedagogico_politicas" ("ativo");

-- --------------------------------------------------------------------
-- 11. pedagogico_integracao_logs
--     Log de cada tentativa de integração com Salesforce / sistemas
--     externos. UNIQUE(sistema_origem, evento, id_externo) garante
--     idempotência: re-processar um webhook já processado é seguro.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_integracao_logs" (
  "id"              BIGSERIAL   NOT NULL,
  "sistema_origem"  TEXT        NOT NULL DEFAULT 'salesforce',
  -- VENDA_APROVADA|VENDA_CANCELADA|SYNC_TURMA|SYNC_MATRICULA|etc.
  "evento"          TEXT        NOT NULL,
  -- ID do objeto no sistema de origem
  "id_externo"      TEXT        NULL,
  "payload"         JSONB       NULL,
  -- pendente|ok|erro|ignorado
  "resultado"       TEXT        NOT NULL DEFAULT 'pendente',
  -- Links opcionais para entidades criadas/afetadas pelo evento
  "matricula_id"    UUID        NULL,
  "turma_id"        UUID        NULL,
  "erro_msg"        TEXT        NULL,
  "tentativas"      INTEGER     NOT NULL DEFAULT 1,
  "processado_em"   TIMESTAMPTZ NULL,
  "criado_em"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_integracao_logs_pkey"     PRIMARY KEY ("id"),
  -- Idempotência: o mesmo evento externo não é processado duas vezes
  CONSTRAINT "pedagogico_integracao_logs_idem_key" UNIQUE ("sistema_origem", "evento", "id_externo")
);

CREATE INDEX "pedagogico_integracao_logs_origem_resultado_idx"
  ON "pedagogico_integracao_logs" ("sistema_origem", "resultado");
CREATE INDEX "pedagogico_integracao_logs_id_externo_idx"
  ON "pedagogico_integracao_logs" ("id_externo");
CREATE INDEX "pedagogico_integracao_logs_matricula_idx"
  ON "pedagogico_integracao_logs" ("matricula_id");
CREATE INDEX "pedagogico_integracao_logs_turma_idx"
  ON "pedagogico_integracao_logs" ("turma_id");

-- --------------------------------------------------------------------
-- 12. pedagogico_solicitacoes
--     Central de solicitações: certificado, declaração, transferência,
--     cancelamento, titularidade, suporte — tudo que o aluno abre um
--     chamado e a equipe precisa resolver.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_solicitacoes" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"   UUID        NULL,
  -- FK fraca (mesmo padrão de pessoa_id)
  "pessoa_id"      TEXT        NOT NULL,
  -- certificado|declaracao|transferencia|cancelamento|titularidade|suporte
  "tipo"           TEXT        NOT NULL,
  -- aberta|em_analise|aprovada|rejeitada|concluida
  "status"         TEXT        NOT NULL DEFAULT 'aberta',
  "descricao"      TEXT        NULL,
  "resposta"       TEXT        NULL,
  "responsavel_id" UUID        NULL,
  -- baixa|normal|alta|urgente
  "prioridade"     TEXT        NOT NULL DEFAULT 'normal',
  "prazo"          DATE        NULL,
  "resolvido_em"   TIMESTAMPTZ NULL,
  "criado_por"     UUID        NULL,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_solicitacoes_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_solic_matricula"             FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE SET NULL
);

CREATE INDEX "pedagogico_solicitacoes_status_idx"       ON "pedagogico_solicitacoes" ("status");
CREATE INDEX "pedagogico_solicitacoes_tipo_idx"         ON "pedagogico_solicitacoes" ("tipo");
CREATE INDEX "pedagogico_solicitacoes_pessoa_id_idx"    ON "pedagogico_solicitacoes" ("pessoa_id");
CREATE INDEX "pedagogico_solicitacoes_responsavel_idx"  ON "pedagogico_solicitacoes" ("responsavel_id");

-- --------------------------------------------------------------------
-- 13. pedagogico_cs_acompanhamentos
--     Customer Success: alunos que precisam de atenção especial.
--     Criado quando um aluno não comparece, não confirma, acumula
--     transferências, tem reclamação ou validade próxima do vencimento.
-- --------------------------------------------------------------------
CREATE TABLE "pedagogico_cs_acompanhamentos" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "matricula_id"   UUID        NULL,
  -- FK fraca
  "pessoa_id"      TEXT        NOT NULL,
  "pessoa_nome"    TEXT        NULL,
  -- nao_compareceu|nao_confirmou|nao_concluiu|transferencias_repetidas|
  -- reclamacao|validade_proxima|coaching_parado|pendencia
  "motivo"         TEXT        NOT NULL,
  -- baixa|normal|alta|urgente
  "prioridade"     TEXT        NOT NULL DEFAULT 'normal',
  -- aberto|em_acompanhamento|resolvido|descartado
  "status"         TEXT        NOT NULL DEFAULT 'aberto',
  "responsavel_id" UUID        NULL,
  "proxima_acao"   TEXT        NULL,
  "prazo"          DATE        NULL,
  "observacoes"    TEXT        NULL,
  "resultado"      TEXT        NULL,
  "resolvido_em"   TIMESTAMPTZ NULL,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pedagogico_cs_acompanhamentos_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "fk_ped_cs_matricula"                   FOREIGN KEY ("matricula_id")
    REFERENCES "pedagogico_matriculas" ("id") ON DELETE SET NULL
);

CREATE INDEX "pedagogico_cs_acompanhamentos_status_idx"
  ON "pedagogico_cs_acompanhamentos" ("status");
CREATE INDEX "pedagogico_cs_acompanhamentos_motivo_idx"
  ON "pedagogico_cs_acompanhamentos" ("motivo");
CREATE INDEX "pedagogico_cs_acompanhamentos_responsavel_idx"
  ON "pedagogico_cs_acompanhamentos" ("responsavel_id");
CREATE INDEX "pedagogico_cs_acompanhamentos_pessoa_idx"
  ON "pedagogico_cs_acompanhamentos" ("pessoa_id");

-- ====================================================================
-- PERMISSÕES — Atualização do catálogo de permissões dos perfis padrão
--
-- Permissões do módulo Pedagógico:
--   pedagogico.ver       — Ver turmas, alunos e dashboard
--   pedagogico.operar    — Confirmar, credenciar, registrar presença
--   pedagogico.gerenciar — Criar/editar turmas, matricular, transferir, emitir certificados
--   pedagogico.monitores — Acesso de monitor (só turmas autorizadas, presença e check-in)
--   pedagogico.cs        — Customer Success
--
-- Mapeamento por perfil:
--   admin       -> todas
--   diretoria   -> ver + gerenciar + cs
--   gestor      -> ver + gerenciar + cs
--   equipe      -> ver + operar + monitores
-- ====================================================================
WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria', 'pedagogico.ver'),
  ('diretoria', 'pedagogico.gerenciar'),
  ('diretoria', 'pedagogico.cs'),
  ('gestor',    'pedagogico.ver'),
  ('gestor',    'pedagogico.gerenciar'),
  ('gestor',    'pedagogico.cs'),
  ('equipe',    'pedagogico.ver'),
  ('equipe',    'pedagogico.operar'),
  ('equipe',    'pedagogico.monitores')
), agrupadas AS (
  SELECT slug, array_agg(permissao) AS permissoes FROM adicoes GROUP BY slug
)
UPDATE perfis_acesso p
SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || a.permissoes))
FROM agrupadas a
WHERE p.slug = a.slug;

UPDATE perfis_acesso
SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY[
  'pedagogico.ver',
  'pedagogico.operar',
  'pedagogico.gerenciar',
  'pedagogico.monitores',
  'pedagogico.cs'
]))
WHERE slug = 'admin';
