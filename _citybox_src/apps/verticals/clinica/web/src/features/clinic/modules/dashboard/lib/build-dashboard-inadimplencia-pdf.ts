import { jsPDF } from 'jspdf';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  mapClinicSettingsToPdfClinic,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type {
  DashboardInadimplenciaDebtRow,
  DashboardInadimplenciaReport,
} from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';
import { formatDashboardCurrencyFromCents } from './format-dashboard-currency';
import { formatInadimplenciaRate } from './dashboard-inadimplencia';

export const mapClinicSettingsToInadimplenciaPdfClinic =
  mapClinicSettingsToPdfClinic;

export function buildDashboardInadimplenciaPdfFileName(
  periodLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `inadimplencia-${slugifyPatientPdfFileNamePart(periodLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export function buildDashboardInadimplentesPdfFileName(
  title: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `inadimplentes-${slugifyPatientPdfFileNamePart(title)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

type TableColumn = { header: string; width: number };

async function drawClinicDocumentShell(input: {
  doc: jsPDF;
  clinic?: PatientPdfClinicInfo;
  documentTitle: string;
  sectionTitle: string;
  metaRows: string[];
  generatedAt: Date;
}): Promise<number> {
  const writer = createPatientPdfWriter(input.doc);
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? {
    clinicName: 'Clínica',
  };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: input.documentTitle,
    issuedAtLabel: formatPatientPdfDateTime(input.generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, input.metaRows, {
    title: input.sectionTitle,
  });

  return writer.cursorY + 4;
}

function drawTableHeader(
  doc: jsPDF,
  cols: readonly TableColumn[],
  contentWidth: number,
  y: number,
): number {
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  doc.setFillColor(243, 244, 246);
  doc.rect(marginX, y - 4, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  let x = marginX + 1;
  cols.forEach((col, index) => {
    if (index === cols.length - 1) {
      doc.text(col.header, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(col.header, x, y);
    }
    x += col.width;
  });
  return y + 8;
}

function drawTableRow(
  doc: jsPDF,
  cols: readonly TableColumn[],
  values: string[],
  contentWidth: number,
  y: number,
): number {
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  let x = marginX + 1;
  doc.setTextColor(40, 40, 40);
  values.forEach((value, index) => {
    const col = cols[index];
    if (!col) return;
    if (index === cols.length - 1) {
      doc.text(value, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(value, x, y);
    }
    x += col.width;
  });

  y += 2;
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
  return y + 7;
}

export async function buildDashboardInadimplenciaPdf(input: {
  periodLabel: string;
  report: DashboardInadimplenciaReport;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'FINANCEIRO',
    sectionTitle: 'Inadimplência',
    metaRows: [
      input.periodLabel,
      `Taxa ${formatInadimplenciaRate(input.report.ratePercent)} · Não recebido ${formatDashboardCurrencyFromCents(input.report.unpaidCents)} · Total ${formatDashboardCurrencyFromCents(input.report.totalDebtsCents)}`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Composição', width: 90 },
    { header: '%', width: 36 },
    { header: 'Valor', width: contentWidth - 90 - 36 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (input.report.slices.every((slice) => slice.valueCents <= 0)) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum débito no período.', marginX, y);
    y += 6;
  } else {
    for (const slice of input.report.slices) {
      if (slice.valueCents <= 0) continue;
      if (y > 270) {
        doc.addPage();
        y = 18;
        y = drawTableHeader(doc, cols, contentWidth, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      y = drawTableRow(
        doc,
        cols,
        [
          slice.label,
          formatInadimplenciaRate(slice.percent),
          formatDashboardCurrencyFromCents(slice.valueCents),
        ],
        contentWidth,
        y,
      );
    }
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export async function buildDashboardInadimplentesPdf(input: {
  title: string;
  rows: readonly DashboardInadimplenciaDebtRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'FINANCEIRO',
    sectionTitle: input.title,
    metaRows: [`${input.rows.length} débito(s) em aberto`],
    generatedAt,
  });

  const cols = [
    { header: 'Vencimento', width: 28 },
    { header: 'Atraso', width: 18 },
    { header: 'Paciente', width: 52 },
    { header: 'Descrição', width: 78 },
    { header: 'Telefone', width: 36 },
    { header: 'Valor', width: contentWidth - 28 - 18 - 52 - 78 - 36 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (input.rows.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum débito em aberto no período.', marginX, y);
    y += 6;
  } else {
    for (const row of input.rows) {
      if (y > 185) {
        doc.addPage();
        y = 18;
        y = drawTableHeader(doc, cols, contentWidth, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      const patientName =
        row.patientName.length > 28
          ? `${row.patientName.slice(0, 25)}...`
          : row.patientName;
      const description =
        row.description.length > 42
          ? `${row.description.slice(0, 39)}...`
          : row.description;

      y = drawTableRow(
        doc,
        cols,
        [
          formatLocalDateBr(row.dueDate),
          String(row.daysOverdue),
          patientName,
          description,
          formatPhone(row.phone ?? '') || '—',
          formatDashboardCurrencyFromCents(row.unpaidCents),
        ],
        contentWidth,
        y,
      );
    }
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
