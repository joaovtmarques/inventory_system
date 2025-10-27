import { authOptions } from "@/lib/auth";
import { capitalize } from "@/lib/capitalize";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getRankAbbreviation } from "@/lib/rank";
import { ItemCondition, LoanStatus, LoanType } from "@prisma/client";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import PizZip from "pizzip";

interface LoanEquipment {
  id: string;
  loanId: string;
  equipmentId: string;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
  equipment: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string;
    amount: number;
    unitPrice: number;
    condition: ItemCondition;
    observation: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface LoanSerial {
  id: string;
  loanId: string;
  serialNumberId: string;
  createdAt: Date;
  serialNumber: {
    id: string;
    number: string;
    equipmentId: string;
    status: string;
    condition: ItemCondition;
    observation: string | null;
    createdAt: Date;
    updatedAt: Date;
    equipment: {
      id: string;
      name: string;
      description: string | null;
      categoryId: string;
      amount: number;
      unitPrice: number;
      condition: ItemCondition;
      observation: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

interface LoanWithRelations {
  id: string;
  date: Date;
  devolutionDate: Date | null;
  status: LoanStatus;
  observation: string | null;
  mission: string | null;
  type: LoanType;
  urgency: string | null;
  lenderId: string;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderNumber: number;
  lender: {
    name: string;
    rank?: string;
    warName?: string;
    function: string;
  };
  customer: {
    name: string;
    rank?: string;
    warName?: string;
    militaryOrganization: string;
  } | null;
  equipments: LoanEquipment[];
  serialNumbers: LoanSerial[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const loan = (await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        lender: {
          select: {
            name: true,
            rank: true,
            warName: true,
            function: true,
          },
        },
        customer: {
          select: {
            name: true,
            rank: true,
            warName: true,
            militaryOrganization: true,
          },
        },
        equipments: {
          include: {
            equipment: true,
          },
        },
        serialNumbers: {
          include: {
            serialNumber: {
              include: {
                equipment: true,
              },
            },
          },
        },
      },
    })) as unknown as LoanWithRelations | null;

    if (!loan) {
      return NextResponse.json(
        { error: "Cautela não encontrada" },
        { status: 404 }
      );
    }

    const dateFormatted = new Date(loan.date).toLocaleDateString("pt-BR");
    const devolutionDateFormatted = loan.devolutionDate
      ? new Date(loan.devolutionDate).toLocaleDateString("pt-BR")
      : "-";

    const equipments = loan.equipments.map((le: LoanEquipment) => {
      const serials =
        loan.serialNumbers
          .filter(
            (s: LoanSerial) => s.serialNumber.equipmentId === le.equipmentId
          )
          .map((s: LoanSerial) => s.serialNumber.number)
          .join(", ") || "-";

      return {
        material: le.equipment.name,
        numero_de: serials,
        tipo: le.equipment.description || "-",
        condicao: getConditionInPortuguese(le.equipment.condition),
        quantidade: le.quantity.toString(),
        preco: `R$ ${Number(le.totalPrice || 0)
          .toFixed(2)
          .replace(".", ",")}`,
      };
    });

    const totalPrice = loan.equipments.reduce(
      (acc: number, item: LoanEquipment) => acc + Number(item.totalPrice || 0),
      0
    );

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "loan-equipments-form2.docx"
    );
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      receiver: capitalize(loan.customer?.name!) || "-",
      rank: getRankAbbreviation(loan.customer?.rank!) || "-",
      warName: capitalize(loan.customer?.warName!) || "-",
      lenderRank: getRankAbbreviation(loan.lender.rank!) || "-",
      lender: capitalize(loan.lender.name) || "-",
      date: dateFormatted,
      devolutionDate: devolutionDateFormatted,
      observation: loan.observation || "Sem observação",
      equipments: equipments,
      totalPrice: `R$ ${totalPrice.toFixed(2).replace(".", ",")}`,
      militaryOrganization: loan.customer?.militaryOrganization || "-",
      function: loan.lender.function,
      nrcautela: loan.orderNumber,
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    const today = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    const tmpFolder = path.join(process.cwd(), "tmp", today);
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true });

    const filePath = path.join(
      tmpFolder,
      `loan-${loan.customer?.rank + "" + loan.customer?.warName}.docx`
    );
    fs.writeFileSync(filePath, buffer);

    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=loan-${loan.id}.docx`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar documento:", error);
    return NextResponse.json(
      { error: "Erro ao gerar documento" },
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
