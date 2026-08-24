import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { formatPdfPeriodLabel } from '@/features/clinic/lib/format-pdf-period-label';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_LINE_HEIGHT,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import type {
  CommissionRuleGroup,
  CommissionSummaryRow,
  CommissionTreatmentRow,
} from '../types/commission-financial.types';
import type { PeriodDateRange } from './filter-commissions-by-period';

const TABLE_HEADER_HEIGHT = 8;
const TABLE_ROW_PADDING_Y = 2.2;
const TABLE_FONT_SIZE = 8;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];
const SECTION_FILL: [number, number, number] = [248, 250, 252];

type TableColumnKey =
  | 'paidAt'
  | 'patientName'
  | 'treatmentName'
  | 'paidValue'
  | 'treatmentCost'
  | 'installment'
  | 'commission';

type TableColumn = {
  key: TableColumnKey;
  header: string;
  width: number;
  align: 'left' | 'right' | 'center';
};

/** Larguras em mm (somatório = 182 — contentWidth A4 portrait com margem 14). */
const TABLE_COLUMNS: TableColumn[] = [
  { key: 'paidAt', header: 'Pago em', width: 22, align: 'left' },
  { key: 'patientName', header: 'Paciente', width: 36, align: 'left' },
  { key: 'treatmentName', header: 'Procedimento', width: 36, align: 'left' },
  { key: 'paidValue', header: 'Valor pago', width: 24, align: 'right' },
  { key: 'treatmentCost', header: 'Custo trat.', width: 24, align: 'right' },
  { key: 'installment', header: 'Parc.', width: 14, align: 'center' },
  { key: 'commission', header: 'Comissão', width: 26, align: 'right' },
];

export type BuildCommissionReportPdfInput = {
  row: CommissionSummaryRow;
  mode: 'open' | 'history';
  periodRange: PeriodDateRange;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

function formatIsoDateShort(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return iso;
  }
}

function getCellValue(item: CommissionTreatmentRow, key: TableColumnKey): string {
  switch (key) {
    case 'paidAt':
      return formatIsoDateShort(item.paidAt);
    case 'patientName':
      return item.patientName || '—';
    case 'treatmentName':
      return item.treatmentName || '—';
    case 'paidValue':
      return formatBrlCurrencyFromCents(item.paidValueCents);
    case 'treatmentCost':
      return formatBrlCurrencyFromCents(item.treatmentCostCents);
    case 'installment':
      return item.installment ?? '—';
    case 'commission':
      return formatBrlCurrencyFromCents(item.commissionCents);
  }
}

function getColumnX(columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += TABLE_COLUMNS[index]?.width ?? 0;
  }
  return x;
}

async function drawDocumentHeader(
  writer: PatientPdfWriter,
  input: BuildCommissionReportPdfInput,
): Promise<void> {
  const { row, mode, periodRange, generatedAt = new Date() } = input;
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);
  const metaRows = [
    `Profissional: ${row.professionalName}`,
    `Período: ${formatPdfPeriodLabel(periodRange.startDate, periodRange.endDate)}`,
    mode === 'open' ? 'Situação: Em aberto' : 'Situação: Histórico de pagamentos',
  ];
  if (mode === 'history' && row.paidAt) {
    metaRows.push(`Pago em: ${formatIsoDateShort(row.paidAt)}`);
  }

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'COMISSÕES',
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, metaRows, {
    title: 'Relatório de comissões',
  });
}

function drawGroupHeading(writer: PatientPdfWriter, group: CommissionRuleGroup): void {
  const { doc, contentWidth } = writer;
  const title = `${group.triggerLabel} · Plano ${group.planName} › ${group.specialtyName} › ${group.treatmentSummary}`;
  const lines = splitPatientPdfText(doc, title, contentWidth - 40);
  const blockHeight = Math.max(lines.length * 4.5 + 6, 12);

  writer.ensureSpace(blockHeight + 2);

  const top = writer.cursorY;
  doc.setFillColor(...SECTION_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.roundedRect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, blockHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);

  let lineY = top + 5.5;
  for (const line of lines) {
    doc.text(line, PATIENT_PDF_PAGE_MARGIN_X + 3, lineY);
    lineY += 4.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    formatBrlCurrencyFromCents(group.totalCommissionCents),
    PATIENT_PDF_PAGE_MARGIN_X + contentWidth - 3,
    top + blockHeight / 2 + 1.5,
    { align: 'right' },
  );

  writer.cursorY = top + blockHeight + 3;
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
    const x = getColumnX(index) + 1.5;
    const textX =
      column.align === 'right'
        ? x + column.width - 3
        : column.align === 'center'
          ? x + column.width / 2
          : x;
    doc.text(column.header, textX, top + 5.3, { align: column.align });
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

function drawTreatmentRows(writer: PatientPdfWriter, rows: CommissionTreatmentRow[]): void {
  const { doc, contentWidth } = writer;

  drawTableHead(writer);

  rows.forEach((item, rowIndex) => {
    const cellLines = TABLE_COLUMNS.map((column) => {
      const padding = column.align === 'left' ? 1.5 : 2;
      const cellWidth = column.width - padding * 2;
      return splitPatientPdfText(doc, getCellValue(item, column.key), cellWidth);
    });

    const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
    const rowHeight = maxLines * 3.8 + TABLE_ROW_PADDING_Y * 2;

    if (writer.cursorY + rowHeight > writer.pageHeight - 18) {
      doc.addPage();
      writer.cursorY = 14;
      drawTableHead(writer);
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
      const paddingX = column.align === 'left' ? 1.5 : 2;
      const x = getColumnX(columnIndex) + paddingX;
      const textX =
        column.align === 'right'
          ? x + column.width - paddingX * 2
          : column.align === 'center'
            ? getColumnX(columnIndex) + column.width / 2
            : x;
      let lineY = rowTop + TABLE_ROW_PADDING_Y + 3.2;

      for (const line of lines) {
        doc.text(line, textX, lineY, { align: column.align });
        lineY += 3.8;
      }
    });

    writer.cursorY = rowTop + rowHeight;
  });

  // Total da regra
  const totalHeight = 8;
  writer.ensureSpace(totalHeight + 2);
  const totalTop = writer.cursorY;
  doc.setFillColor(...TABLE_HEADER_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, totalTop, contentWidth, totalHeight, 'FD');

  const groupTotal = rows.reduce((sum, r) => sum + r.commissionCents, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('Total da regra', PATIENT_PDF_PAGE_MARGIN_X + contentWidth - 30, totalTop + 5.3, {
    align: 'right',
  });
  doc.text(
    formatBrlCurrencyFromCents(groupTotal),
    PATIENT_PDF_PAGE_MARGIN_X + contentWidth - 3,
    totalTop + 5.3,
    { align: 'right' },
  );

  writer.cursorY = totalTop + totalHeight + 8;
}

function drawGrandTotal(writer: PatientPdfWriter, row: CommissionSummaryRow): void {
  const { doc, contentWidth } = writer;
  const boxWidth = 72;
  const boxHeight = row.paidValueCents !== undefined ? 22 : 14;
  writer.ensureSpace(boxHeight + 4);

  const boxX = PATIENT_PDF_PAGE_MARGIN_X + contentWidth - boxWidth;
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX, writer.cursorY, boxWidth, boxHeight, 2, 2, 'FD');

  let y = writer.cursorY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('Total comissões', boxX + 4, y);
  doc.text(formatBrlCurrencyFromCents(row.totalCents), boxX + boxWidth - 4, y, {
    align: 'right',
  });

  if (row.paidValueCents !== undefined) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(4, 120, 87);
    doc.text('Valor pago', boxX + 4, y);
    doc.text(formatBrlCurrencyFromCents(row.paidValueCents), boxX + boxWidth - 4, y, {
      align: 'right',
    });
  }

  writer.cursorY += boxHeight + 6;
}

export async function buildCommissionReportPdf({
  row,
  mode,
  periodRange,
  clinic,
  generatedAt = new Date(),
}: BuildCommissionReportPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);

  await drawDocumentHeader(writer, { row, mode, periodRange, clinic, generatedAt });

  if (row.ruleGroups.length === 0) {
    writer.ensureSpace(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      'Nenhuma comissão neste período.',
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY,
    );
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT + 4;
  } else {
    for (const group of row.ruleGroups) {
      drawGroupHeading(writer, group);
      drawTreatmentRows(writer, group.rows);
    }
    drawGrandTotal(writer, row);
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export function buildCommissionReportPdfFileName(
  professionalName: string,
  periodRange: PeriodDateRange,
): string {
  const slug = slugifyPatientPdfFileNamePart(professionalName) || 'profissional';
  return `comissoes-${slug}-${periodRange.startDate}-${periodRange.endDate}.pdf`;
}
