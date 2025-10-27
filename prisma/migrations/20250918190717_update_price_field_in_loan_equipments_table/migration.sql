/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `loan_equipments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "loan_equipments" DROP COLUMN "unitPrice",
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
