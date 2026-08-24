-- Cupom fiscal eletrônico (NFC-e, modelo 65) — spec 005.
--
-- Três mudanças, nenhuma delas tomando lock pesado:
--   1. Valor `NFCE` no enum de tipo de documento
--   2. CSC (Código de Segurança do Contribuinte) no Emitente
--   3. Fila de contingência para cupons emitidos com a SEFAZ fora do ar
--
-- Escrita à mão em vez de gerada: os dois últimos blocos (índice parcial e
-- CHECK) o Prisma não expressa de forma declarativa, e o serviço já tem
-- precedente de SQL manual por esse motivo — ver
-- `20260807180000_drop_ilheus_metropolis_provider`.

-- ---------------------------------------------------------------------------
-- 1. Tipo de documento
-- ---------------------------------------------------------------------------
-- `ADD VALUE` apenas acrescenta ao catálogo do tipo: não reescreve
-- `fiscal_documents` nem `fiscal_sequences`, e não toma lock nelas. Em
-- Postgres 12+ roda dentro de transação desde que o valor novo não seja
-- **usado** na mesma transação — e não é: aqui ele só é declarado.
--
-- É esta linha que dá numeração ISOLADA à NFC-e: `fiscal_sequences` já é única
-- por (company_id, document_type, series, environment), então um valor novo de
-- tipo cria automaticamente uma sequência própria por Emitente.
ALTER TYPE "fiscal"."DocumentType" ADD VALUE IF NOT EXISTS 'NFCE';

-- ---------------------------------------------------------------------------
-- 2. CSC no Emitente
-- ---------------------------------------------------------------------------
-- Nulas e sem default: operação de metadado, instantânea, sem reescrita de
-- tabela. Nulas porque o Emitente existe antes de obter o CSC junto à SEFAZ —
-- passo administrativo do contribuinte. A ausência bloqueia apenas a emissão de
-- cupom; NF-e e NFS-e seguem funcionando.
--
-- `csc_id` é identificador, não segredo. `csc_token_encrypted` é o segredo,
-- cifrado com o mesmo mecanismo da senha do PKCS#12.
ALTER TABLE "fiscal"."companies"
  ADD COLUMN "csc_id" TEXT,
  ADD COLUMN "csc_token_encrypted" TEXT;

-- ---------------------------------------------------------------------------
-- 3. Fila de contingência
-- ---------------------------------------------------------------------------
CREATE TYPE "fiscal"."ContingencyStatus" AS ENUM ('PENDING', 'TRANSMITTED', 'REJECTED');

CREATE TABLE "fiscal"."nfce_contingency_queue" (
  "id"                 UUID         NOT NULL DEFAULT public.citybox_uuid_v7(),
  "fiscal_document_id" UUID         NOT NULL,
  "company_id"         UUID         NOT NULL,
  "sequence"           BIGINT       NOT NULL,
  "emitted_at"         TIMESTAMP(3) NOT NULL,
  "status"             "fiscal"."ContingencyStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"           INTEGER      NOT NULL DEFAULT 0,
  "last_error"         TEXT,
  "transmitted_at"     TIMESTAMP(3),
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nfce_contingency_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nfce_contingency_queue_fiscal_document_id_key"
  ON "fiscal"."nfce_contingency_queue" ("fiscal_document_id");

-- Invariante de que o dreno depende: dois cupons da mesma empresa não podem
-- disputar a mesma posição na fila. Sem esta constraint, uma corrida entre duas
-- emissões em contingência deixaria a ordem indeterminada — exatamente na
-- dimensão que esta tabela existe para proteger, já que fora de ordem a
-- numeração chega quebrada à SEFAZ.
CREATE UNIQUE INDEX "nfce_contingency_queue_company_sequence_key"
  ON "fiscal"."nfce_contingency_queue" ("company_id", "sequence");

-- ⚠️ RESTRICT, não CASCADE.
--
-- Este registro é o rastro de um cupom que **já foi impresso e entregue ao
-- consumidor**. Apagá-lo em cascata deixaria papel na mão do cliente sem
-- correspondência no sistema, em silêncio. RESTRICT força qualquer remoção
-- futura de `fiscal_documents` a ser decisão explícita, não efeito colateral.
ALTER TABLE "fiscal"."nfce_contingency_queue"
  ADD CONSTRAINT "nfce_contingency_queue_fiscal_document_id_fkey"
  FOREIGN KEY ("fiscal_document_id")
  REFERENCES "fiscal"."fiscal_documents"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Índice de dreno — **parcial**.
--
-- A consulta real é sempre "pendentes desta empresa, em ordem de emissão": a
-- SEFAZ volta ao ar por UF, e o worker opera por Emitente. `TRANSMITTED` e
-- `REJECTED` são histórico permanente (auditoria, sem expurgo) e a query nunca
-- os filtra — incluí-los engordaria o índice indefinidamente sem serventia.
--
-- Igualdade (`company_id`) antes de ordenação (`sequence`), na convenção do
-- projeto.
CREATE INDEX "nfce_contingency_queue_pending_idx"
  ON "fiscal"."nfce_contingency_queue" ("company_id", "sequence")
  WHERE "status" = 'PENDING';

-- Amarra o estado ao carimbo de tempo.
--
-- Sem isto, nada impede `status = 'PENDING'` com `transmitted_at` preenchido —
-- ou `TRANSMITTED` sem ele. Numa fila cuja razão de existir é não perder cupom
-- entregue, estado inconsistente é pior que erro: parece resolvido.
ALTER TABLE "fiscal"."nfce_contingency_queue"
  ADD CONSTRAINT "nfce_contingency_queue_transmitted_consistency"
  CHECK (
    ("status" = 'TRANSMITTED' AND "transmitted_at" IS NOT NULL) OR
    ("status" <> 'TRANSMITTED' AND "transmitted_at" IS NULL)
  );
