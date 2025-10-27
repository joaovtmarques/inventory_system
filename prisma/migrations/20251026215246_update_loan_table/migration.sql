-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "orderNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "function" TEXT;
