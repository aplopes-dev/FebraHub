import { jsPDF } from 'jspdf';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
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
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../../lib/format-dashboard-currency';
import type { ReportExcludedRevenueRow } from '../types/clinic-reports';

const TABLE_HEADER_HEIGHT = 7;
const TABLE_ROW_HEIGHT = 6;
const TABLE_FONT_SIZE = 7;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

const TABLE_COLUMNS = [
  { header: 'Paciente', width: 38 },
  { header: 'Descrição', width: 52 },
  { header: 'Valor', width: 26 },
  { header: 'Data exclusão', width: 28 },
  { header: 'Excluído por', width: 38 },
] as const;

export type BuildReportsExcludedRevenuesPdfInput = {
  rows: readonly ReportExcludedRevenueRow[];
  periodLabel: string;
  clinic: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export function buildReportsExcludedRevenuesPdfFileName(
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `relatorio-receitas-excluidas-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
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
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, TABLE_HEADER_HEIGHT, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setTextColor(17, 24, 39);

  TABLE_COLUMNS.forEach((column, index) => {
    doc.text(column.header, getColumnX(index) + 1, top + 4.6);
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

/**
 * PDF do relatório Receitas excluídas com header da clínica
 * e tabela das colunas do relatório.
 */
export async function buildReportsExcludedRevenuesPdf(
  input: BuildReportsExcludedRevenuesPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const generatedAt = input.generatedAt ?? new Date();
  const clinic: PatientPdfClinicInfo = {
    ...input.clinic,
    clinicName: input.clinic.clinicName.trim() || 'Clínica',
  };
  const logo = await loadClinicLogoForPdf(clinic.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: 'RELATÓRIO',
    issuedAtLabel: formatPatientPdfDateLabel(
      formatLocalDateString(generatedAt),
    ),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(
    writer,
    [
      `Período: ${input.periodLabel}`,
      `Total: ${input.rows.length} receita(s)`,
    ],
    { title: 'Receitas excluídas' },
  );

  let lastPage = doc.getNumberOfPages();
  drawTableHead(writer);

  if (input.rows.length === 0) {
    writer.ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      'Nenhuma receita excluída no período selecionado.',
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY + 5,
    );
    writer.cursorY += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TABLE_FONT_SIZE);

    for (const row of input.rows) {
      writer.ensureSpace(TABLE_ROW_HEIGHT + 2);
      if (doc.getNumberOfPages() !== lastPage) {
        lastPage = doc.getNumberOfPages();
        drawTableHead(writer);
      }

      const values = [
        truncate(row.patientName || '—', 24),
        truncate(row.description || '—', 32),
        formatDashboardCurrencyFromCents(row.valueCents),
        formatLocalDateBr(row.excludedAt),
        truncate(row.excludedBy || '—', 24),
      ];

      const top = writer.cursorY;
      doc.setTextColor(40, 40, 40);
      values.forEach((value, index) => {
        doc.text(value, getColumnX(index) + 1, top + 4.2);
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

  return doc.output('blob');
}
