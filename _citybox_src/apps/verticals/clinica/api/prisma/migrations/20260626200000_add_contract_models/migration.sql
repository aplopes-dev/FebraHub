-- CreateTable
CREATE TABLE "clinica"."contract_models" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contract_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_models_store_id_idx" ON "clinica"."contract_models"("store_id");

-- CreateIndex
CREATE INDEX "contract_models_store_id_is_default_idx" ON "clinica"."contract_models"("store_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "contract_models_store_id_name_key" ON "clinica"."contract_models"("store_id", "name");
