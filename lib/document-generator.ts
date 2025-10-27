import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LoanDocData {
  date: string;
  lender_name: string;
  customer_name: string;
  mission: string;
  observation: string;
  equipments: Array<{
    name: string;
    serialNumber: string;
    type: string;
    condition: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
}

interface ReportData {
  date: string;
  equipmentsInUse: Array<{
    equipment: string;
    serialNumber: string;
    stockQuantity: number;
    loanQuantity: number;
    isTemporary: boolean;
    customer: string;
    destination: string;
    loanDate: string;
  }>;
  allEquipments: Array<{
    name: string;
    serialNumber: string;
    stockQuantity: number;
    loanQuantity: number;
    status: string;
    condition: string;
    observation: string;
    price: number;
  }>;
}

export const generateLoanDocument = async (
  templateBuffer: ArrayBuffer,
  data: LoanDocData
): Promise<Blob> => {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Substitui os placeholders básicos
    doc.render({
      date: data.date,
      lender_name: data.lender_name,
      customer_name: data.customer_name,
      mission: data.mission,
      observation: data.observation,
      equipments: data.equipments,
      total_price: data.totalPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    });

    const buffer = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  } catch (error) {
    console.error("Erro ao gerar documento:", error);
    throw new Error("Falha na geração do documento");
  }
};

export const generateDailyReport = async (
  templateBuffer: ArrayBuffer,
  data: ReportData
): Promise<Blob> => {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      date: data.date,
      equipments_in_use: data.equipmentsInUse,
      all_equipments: data.allEquipments,
      conference_date: format(new Date(), "dd/MM/yyyy", { locale: ptBR })
    });

    const buffer = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw new Error("Falha na geração do relatório");
  }
};