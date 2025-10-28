import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getRankAbbreviation } from "@/lib/rank";
import { ItemCondition } from "@prisma/client";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import PizZip from "pizzip";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const equipments = await prisma.equipment.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
        serialNumbers: {
          include: {
            loans: {
              include: {
                loan: {
                  include: {
                    customer: {
                      select: {
                        name: true,
                        rank: true,
                        warName: true,
                      },
                    },
                  },
                },
              },
              where: {
                loan: {
                  status: "ABERTO",
                  equipments: {
                    every: {
                      equipment: {
                        category: {
                          name: {
                            notIn: ["Intendência"],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        category: {
          name: {
            notIn: ["Intendência"],
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const equipmentsOnLoan = equipments.flatMap((equipment) =>
      equipment.serialNumbers
        .filter((serial) => serial.status === "CAUTELADO")
        .map((serial) => {
          const activeLoan = serial.loans[0];
          return {
            material: equipment.name,
            numero_de: serial.number,
            cliente: activeLoan?.loan.customer?.warName || "-",
            destino: activeLoan?.loan.mission || "-",
            quantidade: "1",
            data: activeLoan?.loan.date
              ? new Date(activeLoan.loan.date).toLocaleDateString("pt-BR")
              : "-",
          };
        })
    );

    const allEquipments = equipments.map((equipment) => {
      const serialsOnLoan = equipment.serialNumbers.filter(
        (serial) => serial.status === "CAUTELADO"
      ).length;

      const availableSerials = equipment.serialNumbers.filter(
        (serial) => serial.status === "EM_ESTOQUE"
      ).length;

      return {
        material: equipment.name,
        numero_de:
          equipment.serialNumbers.map((serial) => serial.number).join(", ") ||
          "-",
        categoria: equipment.category.name,
        condicao: getConditionInPortuguese(equipment.condition),
        quantidade: equipment.amount.toString(),
        preco: `R$ ${Number(equipment.unitPrice).toFixed(2).replace(".", ",")}`,
      };
    });

    const totalPrice = equipments.reduce(
      (acc, equipment) => acc + Number(equipment.unitPrice) * equipment.amount,
      0
    );

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "loan-ready2.docx"
    );

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const currentDate = new Date().toLocaleDateString("pt-BR");

    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
    });

    doc.render({
      date: currentDate,
      warName: user!.warName || "-",
      rank: user
        ? getRankAbbreviation(user!.rank ?? "")
        : "P/G não identificado",
      Requipments:
        equipmentsOnLoan.length > 0
          ? equipmentsOnLoan
          : [
              {
                material: "-",
                numero_de: "-",
                cliente: "-",
                destino: "-",
                quantidade: "-",
                data: "-",
              },
            ],
      Equipments:
        allEquipments.length > 0
          ? allEquipments
          : [
              {
                material: "-",
                numero_de: "-",
                categoria: "-",
                condicao: "-",
                quantidade: "-",
                preco: "-",
              },
            ],
      dataProco: `R$ ${totalPrice.toFixed(2).replace(".", ",")}`,
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    const today = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    const tmpFolder = path.join(process.cwd(), "tmp", today);
    if (!fs.existsSync(tmpFolder)) {
      fs.mkdirSync(tmpFolder, { recursive: true });
    }

    const filePath = path.join(
      tmpFolder,
      `situacao-equipamentos-${new Date().getTime()}.docx`
    );
    const uint8Array = new Uint8Array(buffer);
    fs.writeFileSync(filePath, uint8Array);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=situacao-equipamentos-${currentDate.replace(
          /\//g,
          "-"
        )}.docx`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

function getConditionInPortuguese(condition: ItemCondition): string {
  const conditions: { [key in ItemCondition]?: string } = {
    [ItemCondition.NOVO]: "NOVO",
    [ItemCondition.BOM]: "BOM",
    [ItemCondition.REGULAR]: "REGULAR",
    [ItemCondition.RUIM]: "RUIM",
  };

  return conditions[condition] || condition;
}
