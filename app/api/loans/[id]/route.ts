import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    let whereClause = { id: params.id };

    // Se não for admin, só pode ver suas próprias cautelas
    if (!isAdmin(session.user.role)) {
      whereClause = { ...whereClause, lenderId: session.user.id } as any;
    }

    const loan = await prisma.loan.findFirst({
      where: whereClause,
      include: {
        lender: { select: { name: true, email: true } },
        customer: true,
        equipments: {
          include: {
            equipment: true
          }
        },
        serialNumbers: {
          include: {
            serialNumber: {
              include: {
                equipment: { select: { name: true } }
              }
            }
          }
        },
        documents: true,
      }
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Cautela não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error("Error fetching loan:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cautela" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status === "FECHADO") {
      // Devolver equipamentos ao estoque
      const loan = await prisma.loan.findUnique({
        where: { id: params.id },
        include: {
          equipments: true,
          serialNumbers: true,
        }
      });

      if (!loan) {
        return NextResponse.json(
          { error: "Cautela não encontrada" },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Atualizar status da cautela
        await tx.loan.update({
          where: { id: params.id },
          data: { status: "FECHADO" }
        });

        // Devolver quantidades aos equipamentos
        for (const loanEquip of loan.equipments) {
          await tx.equipment.update({
            where: { id: loanEquip.equipmentId },
            data: {
              amount: {
                increment: loanEquip.quantity
              }
            }
          });
        }

        // Devolver números de série ao estoque
        for (const loanSerial of loan.serialNumbers) {
          await tx.serialNumber.update({
            where: { id: loanSerial.serialNumberId },
            data: { status: "EM_ESTOQUE" }
          });
        }
      });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: params.id },
      data: { status },
      include: {
        lender: { select: { name: true, email: true } },
        customer: true,
        equipments: {
          include: {
            equipment: true
          }
        },
        serialNumbers: {
          include: {
            serialNumber: {
              include: {
                equipment: { select: { name: true } }
              }
            }
          }
        },
        documents: true,
      }
    });

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cautela" },
      { status: 500 }
    );
  }
}