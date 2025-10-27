import { authOptions } from "@/lib/auth";
import { formatCPF, formatName } from "@/lib/formatters";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getRankAbbreviation } from "@/lib/rank";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import PizZip from "pizzip";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    console.log("Buscando alteração para download:", id);

    const alteration = await prisma.equipmentAlteration.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            warName: true,
            document: true,
            militaryOrganization: true,
            rank: true,
          },
        },
        loan: {
          include: {
            customer: {
              select: {
                name: true,
                warName: true,
                document: true,
                militaryOrganization: true,
                rank: true,
              },
            },
          },
        },
      },
    });

    if (!alteration) {
      return NextResponse.json(
        { error: "Alteração não encontrada" },
        { status: 404 }
      );
    }

    const customer = alteration.customer || alteration.loan?.customer;

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "disclaimer.docx"
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

    const templateData = {
      name: formatName(customer.name),
      warName: customer.warName ? formatName(customer.warName) : "-",
      document: formatCPF(customer.document!),
      militaryOrganization: customer.militaryOrganization || "-",
      mission: alteration.mission,
      location: alteration.location,
      date: new Date(alteration.date).toLocaleDateString("pt-BR"),
      equipmentName: alteration.equipment,
      amount: alteration.amount,
      serialNumber: alteration.serialNumber.join(", "),
      desc: alteration.desc,
      rank: getRankAbbreviation(customer.rank || ""),
    };

    doc.render(templateData);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    const fileName = `alteracao-${getRankAbbreviation(customer.rank || "")}-${
      customer.warName || customer.name
    }.docx`.replace(/\s+/g, "-");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar documento" },
      { status: 500 }
    );
  }
}
