/*
  Warnings:

  - Made the column `client_id` on table `stores` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_client_id_fkey";

-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "client_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
