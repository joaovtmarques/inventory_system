-- CreateTable
CREATE TABLE "equipment_alterations" (
    "id" TEXT NOT NULL,
    "desc" TEXT,
    "loan_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_alterations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_alterations_loan_id_idx" ON "equipment_alterations"("loan_id");

-- AddForeignKey
ALTER TABLE "equipment_alterations" ADD CONSTRAINT "equipment_alterations_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
