-- Conciliação Stone: transações de cartão da maquininha importadas do arquivo
-- XML da API de Conciliação Stone. Read-only (espelho para conferência).

CREATE TABLE "stone_conciliacao_transacoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stone_code" TEXT NOT NULL,
  "reference_date" DATE NOT NULL,
  "acquirer_transaction_key" TEXT NOT NULL,
  "initiator_transaction_key" TEXT,
  "authorization_datetime" TIMESTAMPTZ(6),
  "capture_datetime" TIMESTAMPTZ(6),
  "account_type" TEXT,
  "brand_id" TEXT,
  "brand_nome" TEXT,
  "card_number" TEXT,
  "number_of_installments" INTEGER NOT NULL DEFAULT 1,
  "authorization_code" TEXT,
  "poi_serial_number" TEXT,
  "gross_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "fee_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "prevision_payment_date" DATE,
  "cancelado" BOOLEAN NOT NULL DEFAULT false,
  "bruto" JSONB,
  "importado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "stone_conciliacao_transacoes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stone_conciliacao_transacoes_acquirer_transaction_key_key"
  ON "stone_conciliacao_transacoes" ("acquirer_transaction_key");
CREATE INDEX "stone_conciliacao_transacoes_stone_code_reference_date_idx"
  ON "stone_conciliacao_transacoes" ("stone_code", "reference_date");
CREATE INDEX "stone_conciliacao_transacoes_poi_serial_number_idx"
  ON "stone_conciliacao_transacoes" ("poi_serial_number");
CREATE INDEX "stone_conciliacao_transacoes_prevision_payment_date_idx"
  ON "stone_conciliacao_transacoes" ("prevision_payment_date");

CREATE TABLE "stone_conciliacao_imports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stone_code" TEXT NOT NULL,
  "reference_date" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ok',
  "quantidade" INTEGER NOT NULL DEFAULT 0,
  "erro" TEXT,
  "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "stone_conciliacao_imports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stone_conciliacao_imports_stone_code_reference_date_key"
  ON "stone_conciliacao_imports" ("stone_code", "reference_date");
