import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorySchema } from "@/lib/validations";
import { canManageCategories } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageCategories(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = CategorySchema.parse(body);

    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: data.name,
        id: { not: params.id },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageCategories(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se a categoria tem equipamentos associados
    const categoryWithEquipments = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        equipments: {
          include: {
            _count: {
              select: { serialNumbers: true },
            },
          },
        },
      },
    });

    if (!categoryWithEquipments) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    const equipmentCount = categoryWithEquipments.equipments.length;
    const totalSerials = categoryWithEquipments.equipments.reduce(
      (acc, eq) => acc + eq._count.serialNumbers,
      0
    );

    // Deletar a categoria e todos os equipamentos/seriais associados (cascade)
    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      deletedEquipments: equipmentCount,
      deletedSerials: totalSerials,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    );
  }
}
