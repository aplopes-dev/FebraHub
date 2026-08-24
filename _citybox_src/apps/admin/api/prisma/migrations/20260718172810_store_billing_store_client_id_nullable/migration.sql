-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_client_id_fkey";

-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "client_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
