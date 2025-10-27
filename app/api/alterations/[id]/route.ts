import { authOptions } from "@/lib/auth";
import { canManageCategories } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canManageCategories(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    const updatedAlteration = await prisma.equipmentAlteration.update({
      where: { id },
      data: {
        mission: body.mission,
        location: body.location,
        date: body.date,
        desc: body.desc,
        amount: body.amount,
      },
    });

    return NextResponse.json({ success: true, data: updatedAlteration });
  } catch (error) {
    console.error("Erro ao atualizar alteração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar alteração" },
      { status: 500 }
    );
  }
}
