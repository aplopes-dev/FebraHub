CREATE TABLE "processos" (
  "id" UUID PRIMARY KEY, "codigo" TEXT NOT NULL UNIQUE, "nome" TEXT NOT NULL,
  "objetivo" TEXT NOT NULL, "descricao" TEXT, "setor_principal" TEXT NOT NULL,
  "setores_participantes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "responsavel_processo_id" UUID, "responsavel_levantamento_id" UUID, "validador_id" UUID,
  "evento_inicial" TEXT NOT NULL, "resultado_esperado" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'rascunho', "criticidade" TEXT NOT NULL DEFAULT 'media',
  "versao_atual" INTEGER NOT NULL DEFAULT 1, "ultima_revisao" DATE, "proxima_revisao" DATE,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "metadados" JSONB NOT NULL DEFAULT '{}',
  "entrevista" JSONB NOT NULL DEFAULT '{}', "bpmn_xml" TEXT, "manual" JSONB NOT NULL DEFAULT '{}',
  "revisao" INTEGER NOT NULL DEFAULT 1, "criado_por" UUID NOT NULL, "atualizado_por" UUID NOT NULL,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processos_situacao_check" CHECK (situacao IN ('levantamento_iniciado','rascunho','aguardando_informacoes','aguardando_validacao','ajustes_solicitados','aprovado','em_desenvolvimento','em_homologacao','implantado','suspenso','substituido','arquivado')),
  CONSTRAINT "processos_criticidade_check" CHECK (criticidade IN ('baixa','media','alta','critica'))
);
CREATE INDEX "processos_setor_principal_situacao_idx" ON "processos"("setor_principal", "situacao");
CREATE INDEX "processos_validador_id_situacao_idx" ON "processos"("validador_id", "situacao");

CREATE TABLE "processo_versoes" (
  "id" UUID PRIMARY KEY, "processo_id" UUID NOT NULL REFERENCES "processos"("id") ON DELETE CASCADE,
  "numero" INTEGER NOT NULL, "situacao" TEXT NOT NULL, "snapshot" JSONB NOT NULL, "motivo" TEXT,
  "criada_por" UUID NOT NULL, "criada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("processo_id", "numero")
);
CREATE TABLE "processo_auditoria" (
  "id" UUID PRIMARY KEY, "processo_id" UUID NOT NULL REFERENCES "processos"("id") ON DELETE CASCADE,
  "usuario_id" UUID NOT NULL, "acao" TEXT NOT NULL, "anterior" JSONB, "novo" JSONB, "motivo" TEXT,
  "versao" INTEGER, "criada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "processo_auditoria_processo_id_criada_em_idx" ON "processo_auditoria"("processo_id", "criada_em" DESC);

CREATE TABLE "implantacao_entregas" (
  "id" UUID PRIMARY KEY, "titulo" TEXT NOT NULL, "pilar" TEXT NOT NULL, "setor" TEXT NOT NULL, "fase" TEXT NOT NULL,
  "peso" DECIMAL(8,4) NOT NULL, "situacao" TEXT NOT NULL DEFAULT 'nao_iniciado',
  "percentual_aceito" DECIMAL(5,2) NOT NULL DEFAULT 0, "evidencia" TEXT, "previsao" DATE,
  "concluida_em" DATE, "aceita_por" UUID, "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "entregas_pilar_check" CHECK (pilar IN ('sistema','automacao','agentes_ia')),
  CONSTRAINT "entregas_percentual_check" CHECK (percentual_aceito BETWEEN 0 AND 100)
);
CREATE INDEX "implantacao_entregas_pilar_setor_idx" ON "implantacao_entregas"("pilar", "setor");
CREATE TABLE "implantacao_pendencias" (
  "id" UUID PRIMARY KEY, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL, "descricao" TEXT NOT NULL, "setor" TEXT,
  "responsavel_id" UUID, "solicitante_id" UUID NOT NULL, "prazo" DATE, "criticidade" TEXT NOT NULL DEFAULT 'media',
  "situacao" TEXT NOT NULL DEFAULT 'aberta', "decisao_final" TEXT, "metadados" JSONB NOT NULL DEFAULT '{}',
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "implantacao_pendencias_situacao_prazo_idx" ON "implantacao_pendencias"("situacao", "prazo");

UPDATE "perfis_acesso" SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY['processos.ver','processos.mapear','processos.validar','processos.administrar','processos.implantacao'])) WHERE slug='admin';
UPDATE "perfis_acesso" SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY['processos.ver','processos.validar','processos.implantacao'])) WHERE slug='diretoria';
UPDATE "perfis_acesso" SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY['processos.ver','processos.mapear','processos.validar'])) WHERE slug='gestor';
UPDATE "perfis_acesso" SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY['processos.ver'])) WHERE slug IN ('equipe','consulta');

-- Fluxo preliminar: deliberadamente rascunho, aguardando validação de Ana.
INSERT INTO "processos" (id,codigo,nome,objetivo,descricao,setor_principal,setores_participantes,evento_inicial,resultado_esperado,situacao,criticidade,metadados,entrevista,manual,criado_por,atualizado_por)
SELECT gen_random_uuid(),'COM-EST-001','Solicitação, compra e entrega de materiais','Controlar da solicitação ao aceite do material','Fluxo preliminar levantado com a líder; não aprovado antes da validação de Ana.','estoque',ARRAY['compras','estoque'],'Usuário abre solicitação','Solicitação encerrada com recebimento confirmado','rascunho','alta',
jsonb_build_object('validadoraNome','Ana','referenciaFuncional','ERPNext','aprovacaoBloqueadaAteValidacao',true),
jsonb_build_object('etapas',ARRAY['Usuário abre solicitação','Sistema gera protocolo','Gestor analisa','Solicitação incompleta retorna','Solicitação recusada é encerrada','Compras verifica o estoque','Item disponível é reservado e entregue','Solicitante confirma o recebimento','Item indisponível segue para classificação de prioridade','Cotações são realizadas','Fornecedores são comparados','Compra é submetida à aprovação','Pedido é emitido','Entrega é acompanhada','Material é recebido e conferido','Divergências são tratadas','Entrada é registrada no estoque','Material é armazenado ou entregue','Solicitante confirma','Solicitação é encerrada']), '{}', id, id
FROM "usuarios" WHERE papel='admin' ORDER BY criado_em LIMIT 1
ON CONFLICT (codigo) DO NOTHING;
