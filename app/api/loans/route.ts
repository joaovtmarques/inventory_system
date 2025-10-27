import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoanSchema } from "@/lib/validations";
import { canCreateLoans, isAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let whereClause = {};

    // Se não for admin, só mostra loans do próprio usuário
    if (!isAdmin(session.user.role)) {
      whereClause = { lenderId: session.user.id };
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where: whereClause,
        include: {
          lender: { select: { name: true, email: true } },
          customer: true,
          equipments: {
            include: {
              equipment: { select: { name: true } },
            },
          },
          serialNumbers: {
            include: {
              serialNumber: {
                include: {
                  equipment: { select: { name: true } },
                },
              },
            },
          },
          documents: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cautelas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canCreateLoans(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = LoanSchema.parse(body);

    // Validar disponibilidade de estoque
    for (const item of data.equipments) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: item.equipmentId },
        include: {
          serialNumbers: {
            where: { status: "EM_ESTOQUE" },
          },
        },
      });

      if (!equipment) {
        return NextResponse.json(
          { error: `Equipamento não encontrado` },
          { status: 400 }
        );
      }

      if (equipment.amount < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${equipment.name}` },
          { status: 400 }
        );
      }

      if (item.serialNumbers && item.serialNumbers.length > 0) {
        const availableSerials = equipment.serialNumbers.filter((s) =>
          item.serialNumbers!.includes(s.id)
        );

        if (availableSerials.length !== item.serialNumbers.length) {
          return NextResponse.json(
            {
              error: `Números de série não disponíveis para ${equipment.name}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Criar transação
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          lenderId: session.user.id,
          customerId: data.customerId,
          devolutionDate: data.devolutionDate,
          observation: data.observation,
          mission: data.mission,
          type: data.type,
          urgency: data.urgency,
        },
      });

      for (const item of data.equipments) {
        const equipment = await tx.equipment.findUnique({
          where: { id: item.equipmentId },
        });

        if (!equipment) throw new Error("Equipamento não encontrado");

        const totalPrice = Number(equipment.unitPrice) * item.quantity;

        await tx.loanEquipment.create({
          data: {
            loanId: newLoan.id,
            equipmentId: item.equipmentId,
            quantity: item.quantity,
            totalPrice,
          },
        });

        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: {
            amount: { decrement: item.quantity },
          },
        });

        if (item.serialNumbers && item.serialNumbers.length > 0) {
          for (const serialId of item.serialNumbers) {
            await tx.loanSerial.create({
              data: { loanId: newLoan.id, serialNumberId: serialId },
            });

            await tx.serialNumber.update({
              where: { id: serialId },
              data: { status: "CAUTELADO" },
            });
          }
        }
      }

      return newLoan;
    });

    return NextResponse.json(loan);
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Erro ao criar cautela" },
      { status: 500 }
    );
  }
}
