-- ============================================================================
-- Inteligência Territorial — as 5 tabelas do hub.aplopes.com, consolidadas
-- das 3 migrations do repo de origem (init + document_type + partner_source_id).
--
-- Nomes de tabela/coluna PRESERVADOS (inglês, camelCase) de propósito: a carga
-- inicial é um dump/restore direto do banco do hub — 13,7 mil empresas, 22,5
-- mil contatos, 13,7 mil sócios já validados em produção. Renomear custaria a
-- fidelidade do restore e do ETL, e não compraria nada funcional.
--
-- Idempotente: pode rodar sobre base que já recebeu o restore manual.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "CompanyStatus" AS ENUM ('ativa', 'suspensa', 'inapta', 'baixada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ContactType" AS ENUM ('telefone', 'email', 'site');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ConnectionType" AS ENUM ('grupo', 'socio', 'comercial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "niches" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "niches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "documentType" VARCHAR(4) NOT NULL DEFAULT 'nd',
    "nicheId" TEXT NOT NULL,
    "cnae" TEXT NOT NULL,
    "cnaeDescription" TEXT NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "revenue" DECIMAL(14,2) NOT NULL,
    "revenueRange" VARCHAR(4) NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "groupId" TEXT,
    "groupName" TEXT,
    "website" TEXT,
    "status" "CompanyStatus" NOT NULL,
    "openedAt" DATE NOT NULL,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "company_partners" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ownershipPercentage" INTEGER NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "company_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "company_contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "company_connections" (
    "id" TEXT NOT NULL,
    "sourceCompanyId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "type" "ConnectionType" NOT NULL,
    "strength" DECIMAL(4,2) NOT NULL,
    "nicheId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "company_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "niches_slug_key" ON "niches"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "companies_document_key" ON "companies"("document");
CREATE INDEX IF NOT EXISTS "companies_state_idx" ON "companies"("state");
CREATE INDEX IF NOT EXISTS "companies_city_idx" ON "companies"("city");
CREATE INDEX IF NOT EXISTS "companies_nicheId_idx" ON "companies"("nicheId");
CREATE INDEX IF NOT EXISTS "companies_revenue_idx" ON "companies"("revenue");
CREATE INDEX IF NOT EXISTS "companies_employeeCount_idx" ON "companies"("employeeCount");
CREATE INDEX IF NOT EXISTS "companies_status_idx" ON "companies"("status");
CREATE INDEX IF NOT EXISTS "companies_latitude_longitude_idx" ON "companies"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "companies_state_city_idx" ON "companies"("state", "city");
CREATE INDEX IF NOT EXISTS "companies_revenueRange_idx" ON "companies"("revenueRange");
CREATE INDEX IF NOT EXISTS "companies_documentType_idx" ON "companies"("documentType");
CREATE INDEX IF NOT EXISTS "company_partners_companyId_idx" ON "company_partners"("companyId");
CREATE INDEX IF NOT EXISTS "company_partners_name_idx" ON "company_partners"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "company_partners_sourceId_key" ON "company_partners"("sourceId");
CREATE INDEX IF NOT EXISTS "company_contacts_companyId_idx" ON "company_contacts"("companyId");
CREATE INDEX IF NOT EXISTS "company_contacts_type_idx" ON "company_contacts"("type");
CREATE INDEX IF NOT EXISTS "company_connections_sourceCompanyId_idx" ON "company_connections"("sourceCompanyId");
CREATE INDEX IF NOT EXISTS "company_connections_targetCompanyId_idx" ON "company_connections"("targetCompanyId");
CREATE INDEX IF NOT EXISTS "company_connections_type_idx" ON "company_connections"("type");
CREATE INDEX IF NOT EXISTS "company_connections_strength_idx" ON "company_connections"("strength");

DO $$ BEGIN
  ALTER TABLE "companies" ADD CONSTRAINT "companies_nicheId_fkey"
    FOREIGN KEY ("nicheId") REFERENCES "niches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "company_partners" ADD CONSTRAINT "company_partners_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "company_connections" ADD CONSTRAINT "company_connections_sourceCompanyId_fkey"
    FOREIGN KEY ("sourceCompanyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "company_connections" ADD CONSTRAINT "company_connections_targetCompanyId_fkey"
    FOREIGN KEY ("targetCompanyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
