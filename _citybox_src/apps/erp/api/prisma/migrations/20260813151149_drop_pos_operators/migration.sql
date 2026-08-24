/*
  Warnings:

  - You are about to drop the `pos_operators` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pos_operators" DROP CONSTRAINT "pos_operators_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "pos_operators" DROP CONSTRAINT "pos_operators_organization_id_fkey";

-- DropTable
DROP TABLE "pos_operators";

-- DropEnum
DROP TYPE "pos_operator_role";
