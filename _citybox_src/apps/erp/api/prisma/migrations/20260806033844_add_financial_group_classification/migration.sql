-- CreateEnum
CREATE TYPE "FinancialGroupClassification" AS ENUM ('resultado', 'patrimonial');

-- AlterTable
ALTER TABLE "financial_groups" ADD COLUMN     "classification" "FinancialGroupClassification" NOT NULL DEFAULT 'resultado';
