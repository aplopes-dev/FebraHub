import { jsPDF } from "jspdf";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";
import { formatPdfPeriodLabel } from "@/features/clinic/lib/format-pdf-period-label";
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateLabel,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from "@/features/clinic/modules/patients/lib/patient-pdf-shared";
import type { FinancialEntry } from "../types";

const TABLE_HEADER_HEIGHT = 7;
const TABLE_ROW_HEIGHT = 6;
const TABLE_FONT_SIZE = 7;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

const TABLE_COLUMNS = [
  { header: "Data", width: 24 },
  { header: "Tipo", width: 22 },
  { header: "Nome", width: 70 },
  { header: "Status", width: 28 },
  { header: "Valor", width: 28 },
] as const;

export type BuildCashFlowPdfInput = {
  entries: readonly FinancialEntry[];
  periodLabel: string;
  clinic: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export const formatCashFlowPdfPeriodLabel = formatPdfPeriodLabel;

export function buildCashFlowPdfFileName(generatedAt = new Date()): string {
  const stamp = formatLocalDateString(generatedAt);
  return `fluxo-de-caixa-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export function cashFlowEntryStatusLabel(entry: FinancialEntry): string {
  if (entry.isOverdue) return "Vencido";
  if (entry.status === "received") return "Recebido";
  if (entry.status === "paid") return "Pago";
  if (entry.status === "cancelled") return "Cancelado";
  return "Pendente";
}

export function cashFlowEntryDisplayName(entry: FinancialEntry): string {
  return entry.patient?.name?.trim() || entry.description.trim() || "—";
}

function formatCurrencyBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDueDate(dueDate: string): string {
  try {
    return format(parseISO(dueDate.substring(0, 10)), "dd/MM/yyyy", {
      locale: ptBR,
    });
  } catch {
    return dueDate.substring(0, 10) || "—";
  }
}

function getColumnX(columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += TABLE_COLUMNS[index]?.width ?? 0;
  }
  return x;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 3))}...`;
}

function drawTableHead(writer: PatientPdfWriter): void {
  const { doc, contentWidth } = writer;
  writer.ensureSpace(TABLE_HEADER_HEIGHT + 4);
  const top = writer.cursorY;

  doc.setFillColor(...TABLE_HEADER_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, TABLE_HEADER_HEIGHT, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setTextColor(17, 24, 39);

  TABLE_COLUMNS.forEach((column, index) => {
    const alignRight = column.header === "Valor";
    if (alignRight) {
      doc.text(
        column.header,
        getColumnX(index) + column.width - 1,
        top + 4.6,
        { align: "right" },
      );
    } else {
      doc.text(column.header, getColumnX(index) + 1, top + 4.6);
    }
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

/**
 * PDF do Fluxo de caixa com header da clínica e colunas da tabela.
 */
export async function buildCashFlowPdf(
  input: BuildCashFlowPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const writer = createPatientPdfWriter(doc);
  const generatedAt = input.generatedAt ?? new Date();
  const clinic: PatientPdfClinicInfo = {
    ...input.clinic,
    clinicName: input.clinic.clinicName.trim() || "Clínica",
  };
  const logo = await loadClinicLogoForPdf(clinic.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: "FLUXO DE CAIXA",
    issuedAtLabel: formatPatientPdfDateLabel(formatLocalDateString(generatedAt)),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(writer, [
    `Período: ${input.periodLabel}`,
    `Total: ${input.entries.length} lançamento(s)`,
  ]);

  let lastPage = doc.getNumberOfPages();
  drawTableHead(writer);

  if (input.entries.length === 0) {
    writer.ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      "Nenhum lançamento no período selecionado.",
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY + 5,
    );
    writer.cursorY += 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TABLE_FONT_SIZE);

    for (const entry of input.entries) {
      writer.ensureSpace(TABLE_ROW_HEIGHT + 2);
      if (doc.getNumberOfPages() !== lastPage) {
        lastPage = doc.getNumberOfPages();
        drawTableHead(writer);
      }

      const values = [
        formatDueDate(entry.dueDate),
        entry.type === "income" ? "Receita" : "Despesa",
        truncate(cashFlowEntryDisplayName(entry), 42),
        cashFlowEntryStatusLabel(entry),
        formatCurrencyBrl(entry.value),
      ];

      const top = writer.cursorY;
      doc.setTextColor(40, 40, 40);
      values.forEach((value, index) => {
        const column = TABLE_COLUMNS[index]!;
        if (column.header === "Valor") {
          doc.text(value, getColumnX(index) + column.width - 1, top + 4.2, {
            align: "right",
          });
        } else {
          doc.text(value, getColumnX(index) + 1, top + 4.2);
        }
      });

      writer.cursorY = top + TABLE_ROW_HEIGHT;
      doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
      doc.line(
        PATIENT_PDF_PAGE_MARGIN_X,
        writer.cursorY,
        PATIENT_PDF_PAGE_MARGIN_X + writer.contentWidth,
        writer.cursorY,
      );
    }
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output("blob");
}
