/*
  Warnings:

  - You are about to drop the column `customer_id` on the `equipment_alterations` table. All the data in the column will be lost.
  - Added the required column `amount` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment` to the `equipment_alterations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "equipment_alterations" DROP CONSTRAINT "equipment_alterations_customer_id_fkey";

-- AlterTable
ALTER TABLE "equipment_alterations" DROP COLUMN "customer_id",
ADD COLUMN     "amount" TEXT NOT NULL,
ADD COLUMN     "equipment" TEXT NOT NULL,
ADD COLUMN     "serialNumber" TEXT[];
