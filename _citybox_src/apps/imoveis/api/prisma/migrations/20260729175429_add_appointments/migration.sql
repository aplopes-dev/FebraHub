-- CreateEnum
CREATE TYPE "AppointmentKind" AS ENUM ('visit', 'follow_up', 'signing', 'other');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "kind" "AppointmentKind" NOT NULL,
    "agent_id" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "lead_id" TEXT,
    "lead_name" TEXT,
    "lead_email" TEXT,
    "lead_phone" TEXT,
    "lead_photo_url" TEXT,
    "property_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_store_id_starts_at_idx" ON "appointments"("store_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_store_id_agent_id_idx" ON "appointments"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "appointments_store_id_lead_id_idx" ON "appointments"("store_id", "lead_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
