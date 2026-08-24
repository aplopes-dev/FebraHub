-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "rejected_at" DATE,
ADD COLUMN     "rejection_reason" VARCHAR(255);
