import { jsPDF } from 'jspdf';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import type { PatientBudget } from '../types/patient-budget';
import type { PatientBudgetTreatmentItem } from '../types/patient-budget-form';
import {
  calculateInstallmentAmountCents,
  calculateInstallmentBalanceCents,
  calculatePatientBudgetDiscountCents,
  calculatePatientBudgetFinalCents,
  parseBrlCurrencyToCents,
  parsePositiveInteger,
  sumPatientBudgetTreatmentCents,
} from './patient-budget-form-utils';
import { formatBudgetTreatmentListName } from './expand-budget-treatments-by-sessions';
import { formatPatientBudgetToothLabel } from './patient-budget-tooth-numbers';
import { PATIENT_BUDGET_STATUS_LABEL } from './patient-budget-ui';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  loadClinicLogoForPdf,
  mapClinicSettingsToPdfClinic,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_LINE_HEIGHT,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  splitPatientPdfText,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
  formatPatientPdfDateLabel,
} from './patient-pdf-shared';

const TABLE_HEADER_HEIGHT = 8;
const TABLE_ROW_PADDING_Y = 2.5;
const TABLE_FONT_SIZE = 9;

const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

const BUDGET_STATUS_BADGE_COLORS: Record<
  PatientBudget['status'],
  { fill: [number, number, number]; text: [number, number, number]; border: [number, number, number] }
> = {
  draft: {
    fill: [243, 244, 246],
    text: [75, 85, 99],
    border: [209, 213, 219],
  },
  approved: {
    fill: [236, 253, 245],
    text: [4, 120, 87],
    border: [167, 243, 208],
  },
  rejected: {
    fill: [254, 242, 242],
    text: [185, 28, 28],
    border: [254, 202, 202],
  },
};

type TableColumnKey = 'tooth' | 'treatment' | 'professional' | 'plan' | 'value';

type TableColumn = {
  key: TableColumnKey;
  header: string;
  width: number;
  align: 'left' | 'right';
};

const TABLE_COLUMNS: TableColumn[] = [
  { key: 'tooth', header: 'Dente', width: 20, align: 'left' },
  { key: 'treatment', header: 'Procedimento', width: 58, align: 'left' },
  { key: 'professional', header: 'Dentista', width: 40, align: 'left' },
  { key: 'plan', header: 'Plano', width: 36, align: 'left' },
  { key: 'value', header: 'Valor', width: 24, align: 'right' },
];

export type PatientBudgetPdfClinicInfo = PatientPdfClinicInfo;

type BuildPatientBudgetPdfInput = {
  budget: PatientBudget;
  patientName: string;
  clinic?: PatientBudgetPdfClinicInfo;
  generatedAt?: Date;
};

export const mapClinicSettingsToBudgetPdfClinic = mapClinicSettingsToPdfClinic;

export { loadClinicLogoForPdf };

function getTreatmentCellValue(
  treatment: PatientBudgetTreatmentItem,
  key: TableColumnKey,
): string {
  switch (key) {
    case 'tooth':
      return formatPatientBudgetToothLabel(treatment.toothNumber);
    case 'treatment':
      return formatBudgetTreatmentListName(treatment);
    case 'professional':
      return treatment.professionalName || '—';
    case 'plan':
      return treatment.planName || '—';
    case 'value':
      return formatBrlCurrencyFromCents(treatment.valueCents);
    default:
      return '—';
  }
}

function drawBudgetHeader(
  writer: PatientPdfWriter,
  clinic: PatientBudgetPdfClinicInfo,
  budget: PatientBudget,
  patientName: string,
  logo: Awaited<ReturnType<typeof loadClinicLogoForPdf>>,
): void {
  const statusColors = BUDGET_STATUS_BADGE_COLORS[budget.status];

  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: 'ORÇAMENTO',
    issuedAtLabel: formatPatientPdfDateLabel(budget.date),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(
    writer,
    [
      `Paciente: ${patientName}`,
      `Responsável pelo orçamento: ${budget.responsible || '—'}`,
    ],
    {
      title: budget.description,
      trailingBadge: {
        label: PATIENT_BUDGET_STATUS_LABEL[budget.status].toUpperCase(),
        fill: statusColors.fill,
        text: statusColors.text,
        border: statusColors.border,
      },
    },
  );
}

function getColumnX(columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += TABLE_COLUMNS[index]?.width ?? 0;
  }
  return x;
}

function drawTreatmentsTable(writer: PatientPdfWriter, treatments: PatientBudgetTreatmentItem[]): void {
  const { doc, contentWidth } = writer;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Procedimentos', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
  writer.cursorY += 6;

  if (treatments.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum procedimento informado.', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
    return;
  }

  const drawTableHead = () => {
    writer.ensureSpace(TABLE_HEADER_HEIGHT + 4);
    const top = writer.cursorY;

    doc.setFillColor(...TABLE_HEADER_FILL);
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.rect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, TABLE_HEADER_HEIGHT, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TABLE_FONT_SIZE);
    doc.setTextColor(17, 24, 39);

    TABLE_COLUMNS.forEach((column, index) => {
      const x = getColumnX(index) + 2;
      const textX = column.align === 'right' ? x + column.width - 4 : x;
      doc.text(column.header, textX, top + 5.5, { align: column.align });
    });

    writer.cursorY = top + TABLE_HEADER_HEIGHT;
  };

  drawTableHead();

  treatments.forEach((treatment, rowIndex) => {
    const cellLines = TABLE_COLUMNS.map((column) => {
      const padding = column.align === 'right' ? 4 : 2;
      const cellWidth = column.width - padding * 2;
      const value = getTreatmentCellValue(treatment, column.key);
      return splitPatientPdfText(doc, value, cellWidth);
    });

    const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
    const rowHeight = maxLines * 4.2 + TABLE_ROW_PADDING_Y * 2;

    if (writer.cursorY + rowHeight > writer.pageHeight - 18) {
      doc.addPage();
      writer.cursorY = 14;
      drawTableHead();
    }

    const rowTop = writer.cursorY;

    if (rowIndex % 2 === 1) {
      doc.setFillColor(252, 252, 253);
      doc.rect(PATIENT_PDF_PAGE_MARGIN_X, rowTop, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.rect(PATIENT_PDF_PAGE_MARGIN_X, rowTop, contentWidth, rowHeight);

    let columnX = PATIENT_PDF_PAGE_MARGIN_X;
    for (const column of TABLE_COLUMNS) {
      doc.line(columnX, rowTop, columnX, rowTop + rowHeight);
      columnX += column.width;
    }
    doc.line(
      PATIENT_PDF_PAGE_MARGIN_X + contentWidth,
      rowTop,
      PATIENT_PDF_PAGE_MARGIN_X + contentWidth,
      rowTop + rowHeight,
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TABLE_FONT_SIZE);
    doc.setTextColor(31, 41, 55);

    TABLE_COLUMNS.forEach((column, columnIndex) => {
      const lines = cellLines[columnIndex] ?? [''];
      const paddingX = column.align === 'right' ? 4 : 2;
      const x = getColumnX(columnIndex) + paddingX;
      const textX = column.align === 'right' ? x + column.width - paddingX * 2 : x;
      let lineY = rowTop + TABLE_ROW_PADDING_Y + 3.5;

      for (const line of lines) {
        doc.text(line, textX, lineY, { align: column.align });
        lineY += 4.2;
      }
    });

    writer.cursorY = rowTop + rowHeight;
  });

  writer.cursorY += 4;
}

function drawFinancialSummary(
  writer: PatientPdfWriter,
  budget: PatientBudget,
  subtotalCents: number,
  discountCents: number,
  finalCents: number,
): void {
  const { doc, contentWidth } = writer;
  const downPaymentCents = parseBrlCurrencyToCents(budget.installment.downPayment);
  const installmentsCount = parsePositiveInteger(budget.installment.installmentsCount);
  const balanceCents = calculateInstallmentBalanceCents(finalCents, downPaymentCents);
  const installmentAmountCents = calculateInstallmentAmountCents(balanceCents, installmentsCount);

  writer.ensureSpace(28);
  const boxWidth = 78;
  const boxX = PATIENT_PDF_PAGE_MARGIN_X + contentWidth - boxWidth;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX, writer.cursorY, boxWidth, discountCents > 0 ? 30 : 22, 2, 2, 'FD');

  let summaryY = writer.cursorY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text('Subtotal', boxX + 4, summaryY);
  doc.text(formatBrlCurrencyFromCents(subtotalCents), boxX + boxWidth - 4, summaryY, {
    align: 'right',
  });
  summaryY += 6;

  if (discountCents > 0) {
    doc.text('Desconto', boxX + 4, summaryY);
    doc.text(`-${formatBrlCurrencyFromCents(discountCents)}`, boxX + boxWidth - 4, summaryY, {
      align: 'right',
    });
    summaryY += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Valor final', boxX + 4, summaryY);
  doc.text(formatBrlCurrencyFromCents(finalCents), boxX + boxWidth - 4, summaryY, {
    align: 'right',
  });

  writer.cursorY += discountCents > 0 ? 34 : 26;

  if (budget.installment.enabled && installmentsCount > 0) {
    writer.ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Parcelamento', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(
      `Entrada: ${formatBrlCurrencyFromCents(downPaymentCents)}`,
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY,
    );
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
    doc.text(
      `Saldo: ${formatBrlCurrencyFromCents(balanceCents)}`,
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY,
    );
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
    doc.text(
      `${installmentsCount}x de ${formatBrlCurrencyFromCents(installmentAmountCents)}`,
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY,
    );
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT + 2;
  }
}

function drawObservations(writer: PatientPdfWriter, observations: string): void {
  if (!observations.trim()) {
    return;
  }

  const { doc, contentWidth } = writer;
  writer.ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Observações', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
  writer.cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  for (const line of splitPatientPdfText(doc, observations.trim(), contentWidth)) {
    writer.ensureSpace(PATIENT_PDF_LINE_HEIGHT);
    doc.text(line, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
  }

  writer.cursorY += 2;
}

export async function buildPatientBudgetPdf({
  budget,
  patientName,
  clinic,
  generatedAt = new Date(),
}: BuildPatientBudgetPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientBudgetPdfClinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  const subtotalCents = sumPatientBudgetTreatmentCents(budget.treatments);
  const discountCents = calculatePatientBudgetDiscountCents(subtotalCents, budget.discount);
  const finalCents = calculatePatientBudgetFinalCents(subtotalCents, budget.discount);

  drawBudgetHeader(writer, clinicInfo, budget, patientName, logo);
  drawTreatmentsTable(writer, budget.treatments);
  drawFinancialSummary(writer, budget, subtotalCents, discountCents, finalCents);
  drawObservations(writer, budget.observations);
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export function buildPatientBudgetPdfFileName(
  patientName: string,
  budgetDescription: string,
  budgetDate: string,
): string {
  const datePart = budgetDate.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const patientSlug = slugifyPatientPdfFileNamePart(patientName) || 'paciente';
  const descriptionSlug = slugifyPatientPdfFileNamePart(budgetDescription) || 'orcamento';

  return `orcamento-${patientSlug}-${descriptionSlug}-${datePart}.pdf`;
}
