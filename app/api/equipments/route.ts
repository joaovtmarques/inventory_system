import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentSchema } from "@/lib/validations";
import { canManageEquipments } from "@/lib/permissions";

export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        category: true,
        serialNumbers: true,
        _count: {
          select: {
            serialNumbers: {
              where: { status: "EM_ESTOQUE" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(equipments);
  } catch (error) {
    console.error("Error fetching equipments:", error);
    return NextResponse.json(
      { error: "Erro ao buscar equipamentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageEquipments(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = EquipmentSchema.parse(body);

    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "Um equipamento com este nome já existe" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        ...data,
        unitPrice: data.unitPrice,
      },
      include: {
        category: true,
        serialNumbers: true,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Erro ao criar equipamento" },
      { status: 500 }
    );
  }
}
