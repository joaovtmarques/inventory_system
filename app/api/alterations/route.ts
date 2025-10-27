import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentAlterationSchema } from "@/lib/validations";
import { canManageCategories } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  try {
    const alterations = await prisma.equipmentAlteration.findMany({
      include: {
        customer: true,
        loan: {
          include: {
            equipments: {
              include: {
                equipment: {
                  select: {
                    name: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            serialNumbers: true,
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedAlterations = alterations.map((alteration) => ({
      ...alteration,
      equipmentMeta: alteration.loan?.equipments?.[0]?.equipment || {
        name: alteration.equipment,
      },
    }));

    return NextResponse.json(transformedAlterations);
  } catch (error) {
    console.error("Error ao buscar alterações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar alterações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canManageCategories(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const data = EquipmentAlterationSchema.parse(body);

    const createData = {
      desc: data.desc,
      mission: data.mission,
      location: data.location,
      date: data.date,
      equipment: data.equipment,
      serialNumber: data.serialNumber,
      amount: data.amount,
      customerId: data.customerId,
      ...(data.loanId && { loanId: data.loanId }),
    };

    await prisma.equipmentAlteration.create({
      data: createData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro detalhado:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao criar alteração" },
      { status: 500 }
    );
  }
}
