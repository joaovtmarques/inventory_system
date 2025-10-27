import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalEquipments = await prisma.equipment.count();

    const equipmentsInLoan = await prisma.serialNumber.count({
      where: { status: "CAUTELADO" },
    });

    const equipments = await prisma.equipment.findMany({
      select: { unitPrice: true, amount: true },
    });

    const totalValue = equipments.reduce((acc, eq) => {
      return acc + eq.unitPrice.toNumber() * eq.amount;
    }, 0);

    const pendingLoans = await prisma.loan.count({
      where: { status: "ABERTO" },
    });

    return NextResponse.json({
      totalEquipments,
      equipmentsInLoan,
      totalValue,
      pendingLoans,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
