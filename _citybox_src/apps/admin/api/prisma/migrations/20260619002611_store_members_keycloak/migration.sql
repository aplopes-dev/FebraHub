/*
  Warnings:

  - You are about to drop the column `name` on the `store_members` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[store_id,keycloak_sub]` on the table `store_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `first_name` to the `store_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keycloak_sub` to the `store_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `store_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `store_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "store_members" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "keycloak_sub" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "store_members_store_id_keycloak_sub_key" ON "store_members"("store_id", "keycloak_sub");
