-- CreateTable
CREATE TABLE "clinic_store_profiles" (
    "store_id" TEXT NOT NULL,
    "clinic_name" TEXT NOT NULL DEFAULT '',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "communications_name" TEXT NOT NULL DEFAULT '',
    "responsible" TEXT NOT NULL DEFAULT '',
    "logo_object_key" VARCHAR(512),
    "logo_mime_type" VARCHAR(64),
    "opening_time" TEXT NOT NULL DEFAULT '08:00',
    "closing_time" TEXT NOT NULL DEFAULT '18:00',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "cep" TEXT NOT NULL DEFAULT '',
    "street" TEXT NOT NULL DEFAULT '',
    "number" TEXT NOT NULL DEFAULT '',
    "complement" TEXT NOT NULL DEFAULT '',
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" VARCHAR(2) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_store_profiles_pkey" PRIMARY KEY ("store_id")
);
