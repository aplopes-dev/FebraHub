-- AlterTable
ALTER TABLE "nfe_issuances" ADD COLUMN     "error_code" TEXT,
ADD COLUMN     "error_message" TEXT;

-- AlterTable
ALTER TABLE "nfse_issuances" ADD COLUMN     "error_code" TEXT,
ADD COLUMN     "error_message" TEXT;
