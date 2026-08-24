import { jsPDF } from "jspdf";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";
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
import { paymentMethodLabel } from "./payment-method-labels";
import type { FinancialEntry, PaymentMethodSummary } from "../types";

const TABLE_HEADER_HEIGHT = 7;
const TABLE_ROW_HEIGHT = 6;
const TABLE_FONT_SIZE = 7;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

type TableColumn = { header: string; width: number; align?: "left" | "right" };

const DETAIL_COLUMNS: TableColumn[] = [
  { header: "Data", width: 24 },
  { header: "Tipo", width: 22 },
  { header: "Nome", width: 62 },
  { header: "Meio", width: 30 },
  { header: "Valor bruto", width: 34, align: "right" },
];

const METHOD_COLUMNS: TableColumn[] = [
  { header: "Meio de pagamento", width: 50 },
  { header: "Receitas", width: 40, align: "right" },
  { header: "Despesas", width: 40, align: "right" },
  { header: "Saldo", width: 42, align: "right" },
];

export type BuildTransactionsPdfInput = {
  periodLabel: string;
  clinic: PatientPdfClinicInfo;
  generatedAt?: Date;
} & (
  | { mode: "transactions"; entries: readonly FinancialEntry[] }
  | { mode: "payment_method"; rows: readonly PaymentMethodSummary[] }
);

export function buildTransactionsPdfFileName(
  mode: "transactions" | "payment_method",
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  const prefix =
    mode === "payment_method"
      ? "transacoes-meio-pagamento"
      : "transacoes";
  return `${prefix}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

function formatCurrencyBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatEntryDate(entry: FinancialEntry): string {
  const iso = (entry.paidAt ?? entry.dueDate).substring(0, 10);
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso || "—";
  }
}

function displayName(entry: FinancialEntry): string {
  return entry.patient?.name?.trim() || entry.description.trim() || "—";
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 3))}...`;
}

function getColumnX(columns: readonly TableColumn[], columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += columns[index]?.width ?? 0;
  }
  return x;
}

function drawTableHead(
  writer: PatientPdfWriter,
  columns: readonly TableColumn[],
): void {
  const { doc, contentWidth } = writer;
  writer.ensureSpace(TABLE_HEADER_HEIGHT + 4);
  const top = writer.cursorY;

  doc.setFillColor(...TABLE_HEADER_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, TABLE_HEADER_HEIGHT, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setTextColor(17, 24, 39);

  columns.forEach((column, index) => {
    if (column.align === "right") {
      doc.text(
        column.header,
        getColumnX(columns, index) + column.width - 1,
        top + 4.6,
        { align: "right" },
      );
    } else {
      doc.text(column.header, getColumnX(columns, index) + 1, top + 4.6);
    }
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

function drawRowValues(
  writer: PatientPdfWriter,
  columns: readonly TableColumn[],
  values: string[],
): void {
  const { doc } = writer;
  const top = writer.cursorY;
  doc.setTextColor(40, 40, 40);
  values.forEach((value, index) => {
    const column = columns[index]!;
    if (column.align === "right") {
      doc.text(value, getColumnX(columns, index) + column.width - 1, top + 4.2, {
        align: "right",
      });
    } else {
      doc.text(value, getColumnX(columns, index) + 1, top + 4.2);
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

/**
 * PDF da aba Transações — visão detalhada ou por meio de pagamento.
 */
export async function buildTransactionsPdf(
  input: BuildTransactionsPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const writer = createPatientPdfWriter(doc);
  const generatedAt = input.generatedAt ?? new Date();
  const clinic: PatientPdfClinicInfo = {
    ...input.clinic,
    clinicName: input.clinic.clinicName.trim() || "Clínica",
  };
  const logo = await loadClinicLogoForPdf(clinic.logoUrl);
  const columns =
    input.mode === "payment_method" ? METHOD_COLUMNS : DETAIL_COLUMNS;
  const rowCount =
    input.mode === "payment_method" ? input.rows.length : input.entries.length;

  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: "TRANSAÇÕES",
    issuedAtLabel: formatPatientPdfDateLabel(formatLocalDateString(generatedAt)),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(
    writer,
    [
      `Período: ${input.periodLabel}`,
      input.mode === "payment_method"
        ? `Visão: Meio de pagamento · ${rowCount} meio(s)`
        : `Visão: Transações · ${rowCount} lançamento(s)`,
    ],
    { title: "Transações" },
  );

  let lastPage = doc.getNumberOfPages();
  drawTableHead(writer, columns);

  if (rowCount === 0) {
    writer.ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      "Nenhum registro no período selecionado.",
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY + 5,
    );
    writer.cursorY += 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TABLE_FONT_SIZE);

    if (input.mode === "payment_method") {
      for (const row of input.rows) {
        writer.ensureSpace(TABLE_ROW_HEIGHT + 2);
        if (doc.getNumberOfPages() !== lastPage) {
          lastPage = doc.getNumberOfPages();
          drawTableHead(writer, columns);
        }
        drawRowValues(writer, columns, [
          paymentMethodLabel(row.method),
          formatCurrencyBrl(row.income),
          formatCurrencyBrl(row.expense),
          formatCurrencyBrl(row.balance),
        ]);
      }
    } else {
      for (const entry of input.entries) {
        writer.ensureSpace(TABLE_ROW_HEIGHT + 2);
        if (doc.getNumberOfPages() !== lastPage) {
          lastPage = doc.getNumberOfPages();
          drawTableHead(writer, columns);
        }
        const isIncome = entry.type === "income";
        drawRowValues(writer, columns, [
          formatEntryDate(entry),
          isIncome ? "Receita" : "Despesa",
          truncate(displayName(entry), 38),
          paymentMethodLabel(entry.paymentMethod),
          `${isIncome ? "" : "−"}${formatCurrencyBrl(entry.value)}`,
        ]);
      }
    }
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output("blob");
}
