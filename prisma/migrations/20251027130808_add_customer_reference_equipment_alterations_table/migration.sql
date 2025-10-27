/*
  Warnings:

  - Added the required column `customer_id` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "equipment_alterations" ADD COLUMN     "customer_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "equipment_alterations" ADD CONSTRAINT "equipment_alterations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
