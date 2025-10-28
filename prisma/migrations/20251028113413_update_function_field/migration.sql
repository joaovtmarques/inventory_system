/*
  Warnings:

  - You are about to drop the column `function` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "function",
ADD COLUMN     "functionName" TEXT;
