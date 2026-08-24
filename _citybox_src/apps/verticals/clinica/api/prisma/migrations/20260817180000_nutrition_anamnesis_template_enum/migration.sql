-- AlterEnum (cannot run inside a transaction)
ALTER TYPE "clinica"."AnamnesisQuestionType" ADD VALUE IF NOT EXISTS 'rich_text';
ALTER TYPE "clinica"."AnamnesisQuestionType" ADD VALUE IF NOT EXISTS 'single_choice';
