import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SerialNumberSchema } from "@/lib/validations";
import { canManageEquipments } from "@/lib/permissions";

export async function GET() {
  try {
    const serialNumbers = await prisma.serialNumber.findMany({
      include: { equipment: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers:", error);
    return NextResponse.json(
      { error: "Erro ao buscar números de série" },
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
    const data = SerialNumberSchema.parse(body);

    const validStatuses = [
      "EM_ESTOQUE",
      "CAUTELADO",
      "MANUTENCAO",
      "BAIXADO",
    ] as const;
    const validConditions = ["NOVO", "BOM", "REGULAR", "RUIM"] as const;

    if (!validStatuses.includes(data.status)) {
      data.status = "EM_ESTOQUE";
    }

    if (!validConditions.includes(data.condition)) {
      data.condition = "BOM";
    }

    const existingSerialNumber = await prisma.serialNumber.findFirst({
      where: {
        number: data.number,
      },
    });

    if (existingSerialNumber) {
      return NextResponse.json(
        { error: "Número de série já cadastrado" },
        { status: 400 }
      );
    }

    const serialNumber = await prisma.serialNumber.create({
      data: {
        number: data.number,
        equipmentId: data.equipmentId,
        status: data.status,
        condition: data.condition,
        observation: data.observation,
      },
      include: { equipment: true },
    });

    return NextResponse.json(serialNumber);
  } catch (error) {
    console.error("Error creating serial number:", error);
    return NextResponse.json(
      { error: "Erro ao criar número de série" },
      { status: 500 }
    );
  }
}
