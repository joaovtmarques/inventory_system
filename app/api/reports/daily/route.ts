import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ItemCondition, SerialStatus } from "@prisma/client";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import PizZip from "pizzip";

interface EquipmentWithSerials {
  id: string;
  name: string;
  description: string | null;
  category: {
    name: string;
  };
  amount: number;
  unitPrice: number;
  condition: ItemCondition;
  serialNumbers: {
    id: string;
    number: string;
    status: SerialStatus;
    condition: ItemCondition;
    loans: {
      loan: {
        id: string;
        date: Date;
        mission: string | null;
        customer: {
          name: string;
          rank: string | null;
          warName: string | null;
        } | null;
      };
    }[];
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar todos os equipamentos com seus números de série e empréstimos
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
                  status: "ABERTO", // Apenas cautelas abertas
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Preparar dados para a primeira tabela (equipamentos cautelados)
    const equipmentsOnLoan = equipments.flatMap((equipment) =>
      equipment.serialNumbers
        .filter((serial) => serial.status === "CAUTELADO")
        .map((serial) => {
          const activeLoan = serial.loans[0]; // Pega o empréstimo ativo
          return {
            material: equipment.name,
            numero_de: serial.number,
            cliente: activeLoan?.loan.customer?.name || "-",
            destino: activeLoan?.loan.mission || "-",
            quantidade: "1", // Cada serial é 1 unidade
            data: activeLoan?.loan.date
              ? new Date(activeLoan.loan.date).toLocaleDateString("pt-BR")
              : "-",
          };
        })
    );

    // Preparar dados para a segunda tabela (todos os equipamentos)
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

    // Calcular preço total de todos os equipamentos
    const totalPrice = equipments.reduce(
      (acc, equipment) => acc + Number(equipment.unitPrice) * equipment.amount,
      0
    );

    // Carregar template DOCX
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "loan-ready.docx"
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

    // Data atual para o relatório
    const currentDate = new Date().toLocaleDateString("pt-BR");

    // Renderizar o template com os dados
    doc.render({
      date: currentDate,
      // Primeira tabela - Equipamentos em cautela
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
      // Segunda tabela - Todos os equipamentos
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
      // Preço total
      dataProco: `R$ ${totalPrice.toFixed(2).replace(".", ",")}`,
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    // Salvar no tmp/{dataAtual}
    const today = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    const tmpFolder = path.join(process.cwd(), "tmp", today);
    if (!fs.existsSync(tmpFolder)) {
      fs.mkdirSync(tmpFolder, { recursive: true });
    }

    const filePath = path.join(
      tmpFolder,
      `situacao-equipamentos-${new Date().getTime()}.docx`
    );
    fs.writeFileSync(filePath, buffer);

    // Retornar o arquivo
    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

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
