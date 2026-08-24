import { jsPDF } from "jspdf";
import { formatPatientCpf } from "@/features/clinic/modules/patients/lib/format-patient-contact";
import {
  formatPatientPdfDateLabel,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_HEADER_FILL,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfImageAsset,
} from "@/features/clinic/modules/patients/lib/patient-pdf-shared";
import { amountInWordsPtBr } from "./amount-in-words-pt-br";

const VIAS_PER_PAGE = 3;
const PAGE_TOP = 10;
const PAGE_BOTTOM = 10;
const SLOT_GAP = 4;
const CONTENT_WIDTH = 210 - PATIENT_PDF_PAGE_MARGIN_X * 2;

export type BuildIncomeReceiptPdfInput = {
  clinic: PatientPdfClinicInfo;
  professionalName: string;
  professionalEmail: string;
  receiptNumber: string;
  amount: number;
  /** Nome no texto do recibo (paciente ou responsável). */
  payeeName: string;
  /** Nome exibido sob a linha de assinatura (paciente). */
  patientName: string;
  payeeCpf: string;
  patientCpf: string;
  /** true = emitido em nome de outra pessoa (responsável). */
  onBehalfOfOther?: boolean;
  city?: string;
  issuedAt?: Date;
  copies?: number;
};

export function buildIncomeReceiptPdfFileName(input: {
  payeeName: string;
  receiptNumber: string;
}): string {
  const slug = slugifyPatientPdfFileNamePart(input.payeeName) || "recibo";
  return `recibo-${input.receiptNumber}-${slug}.pdf`;
}

type DrawCompactViaParams = {
  doc: jsPDF;
  topY: number;
  slotHeight: number;
  clinic: PatientPdfClinicInfo;
  logo: PatientPdfImageAsset | null;
  professionalName: string;
  professionalEmail: string;
  receiptNumber: string;
  viaLabel: string;
  amountFormatted: string;
  body: string;
  patientName: string;
  city: string;
  dateLabel: string;
};

function drawDashedCutLine(doc: jsPDF, y: number): void {
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setLineWidth(0.3);
  doc.line(PATIENT_PDF_PAGE_MARGIN_X, y, PATIENT_PDF_PAGE_MARGIN_X + CONTENT_WIDTH, y);
  doc.setLineDashPattern([], 0);
}

function drawCompactVia({
  doc,
  topY,
  slotHeight,
  clinic,
  logo,
  professionalName,
  professionalEmail,
  receiptNumber,
  viaLabel,
  amountFormatted,
  body,
  patientName,
  city,
  dateLabel,
}: DrawCompactViaParams): void {
  const pad = 3;
  const left = PATIENT_PDF_PAGE_MARGIN_X + pad;
  const right = PATIENT_PDF_PAGE_MARGIN_X + CONTENT_WIDTH - pad;
  const boxBottom = topY + slotHeight;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setFillColor(...PATIENT_PDF_HEADER_FILL);
  doc.setLineWidth(0.4);
  doc.roundedRect(
    PATIENT_PDF_PAGE_MARGIN_X,
    topY,
    CONTENT_WIDTH,
    slotHeight,
    1.5,
    1.5,
    "S",
  );

  let y = topY + pad + 3;
  const logoSize = 10;

  if (logo) {
    const ratio = Math.min(logoSize / logo.width, logoSize / logo.height);
    const w = logo.width * ratio;
    const h = logo.height * ratio;
    doc.addImage(
      logo.dataUrl,
      logo.format,
      left,
      topY + pad,
      w,
      h,
    );
  }

  const textLeft = logo ? left + logoSize + 3 : left;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(clinic.clinicName || "Clínica", textLeft, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RECIBO", right, y, { align: "right" });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text(`Nº ${receiptNumber}${viaLabel}`, right, y, { align: "right" });

  if (clinic.cnpj || clinic.email) {
    const clinicBits = [clinic.cnpj, clinic.email].filter(Boolean).join(" · ");
    doc.text(clinicBits, textLeft, y, {
      maxWidth: CONTENT_WIDTH * 0.55,
    });
  }
  y += 5;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.line(left, y, right, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Profissional: ${professionalName}`, left, y);
  y += 3.8;
  doc.text(`E-mail: ${professionalEmail || "—"}`, left, y);
  y += 3.8;
  doc.setFont("helvetica", "bold");
  doc.text(`Valor: ${amountFormatted}`, left, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const lines = splitPatientPdfText(doc, body, CONTENT_WIDTH - pad * 2);
  for (const line of lines) {
    if (y > boxBottom - 28) break;
    doc.text(line, left, y);
    y += 3.6;
  }

  const signatureY = Math.min(Math.max(y + 16, topY + slotHeight * 0.72), boxBottom - 12);
  const signatureWidth = 55;
  const signatureX = (210 - signatureWidth) / 2;

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(signatureX, signatureY, signatureX + signatureWidth, signatureY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text(patientName, 105, signatureY + 3.5, { align: "center" });
  doc.text(`${city}, ${dateLabel}`, 105, signatureY + 7, { align: "center" });
}

export async function buildIncomeReceiptPdf(
  input: BuildIncomeReceiptPdfInput,
): Promise<Blob> {
  const issuedAt = input.issuedAt ?? new Date();
  const copies = Math.max(1, input.copies ?? 1);
  const city = input.city?.trim() || "Ilhéus";
  const payeeCpfFormatted = formatPatientCpf(input.payeeCpf);
  const patientCpfFormatted = formatPatientCpf(input.patientCpf);
  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(input.amount);
  const amountWords = amountInWordsPtBr(input.amount);
  const dateLabel = formatPatientPdfDateLabel(
    issuedAt.toISOString().slice(0, 10),
  );

  const body = input.onBehalfOfOther
    ? `Recebemos de ${input.payeeName}, com o CPF ${payeeCpfFormatted}, a quantia de ${amountWords}, referente a tratamento odontológico do paciente ${input.patientName}, com o CPF ${patientCpfFormatted} e por ser verdade, firmamos o presente recibo.`
    : `Recebemos de ${input.payeeName}, com o CPF ${payeeCpfFormatted}, a quantia de ${amountWords}, referente a tratamento odontológico e por ser verdade, firmamos o presente recibo.`;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadClinicLogoForPdf(input.clinic.logoUrl);

  const usableHeight = 297 - PAGE_TOP - PAGE_BOTTOM;
  const slotHeight =
    (usableHeight - SLOT_GAP * (VIAS_PER_PAGE - 1)) / VIAS_PER_PAGE;

  for (let copy = 0; copy < copies; copy += 1) {
    const indexOnPage = copy % VIAS_PER_PAGE;
    if (copy > 0 && indexOnPage === 0) {
      doc.addPage();
    }

    const topY = PAGE_TOP + indexOnPage * (slotHeight + SLOT_GAP);
    const viaLabel = copies > 1 ? ` · Via ${copy + 1}/${copies}` : "";

    if (indexOnPage > 0) {
      drawDashedCutLine(doc, topY - SLOT_GAP / 2);
    }

    drawCompactVia({
      doc,
      topY,
      slotHeight,
      clinic: input.clinic,
      logo,
      professionalName: input.professionalName,
      professionalEmail: input.professionalEmail,
      receiptNumber: input.receiptNumber,
      viaLabel,
      amountFormatted,
      body,
      patientName: input.patientName,
      city,
      dateLabel,
    });
  }

  return doc.output("blob");
}

export function nextReceiptNumber(seed?: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const suffix =
    (seed ?? "").replace(/\W/g, "").slice(-4).toUpperCase() || "0000";
  return `REC-${stamp}-${suffix}`;
}
