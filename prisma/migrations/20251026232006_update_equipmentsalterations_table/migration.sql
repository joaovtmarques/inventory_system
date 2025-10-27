/*
  Warnings:

  - Added the required column `customer_id` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mission` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.
  - Made the column `desc` on table `equipment_alterations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "equipment_alterations" ADD COLUMN     "customer_id" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "mission" TEXT NOT NULL,
ALTER COLUMN "desc" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "equipment_alterations" ADD CONSTRAINT "equipment_alterations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
