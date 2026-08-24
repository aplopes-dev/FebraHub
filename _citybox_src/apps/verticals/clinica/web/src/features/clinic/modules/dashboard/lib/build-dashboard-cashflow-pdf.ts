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
import type {
  DashboardCashflowTimelinePoint,
  DashboardCashflowTotals,
} from '../types/clinic-dashboard';
import { formatDashboardCurrencyFromCents } from './format-dashboard-currency';

export const mapClinicSettingsToCashflowPdfClinic = mapClinicSettingsToPdfClinic;

export function buildDashboardCashflowPdfFileName(
  periodLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `receitas-despesas-${slugifyPatientPdfFileNamePart(periodLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
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
  doc.setFontSize(7);
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

function formatReais(reais: number): string {
  return formatDashboardCurrencyFromCents(Math.round(reais * 100));
}

export async function buildDashboardCashflowPdf(input: {
  periodLabel: string;
  totals: DashboardCashflowTotals;
  timeline: readonly DashboardCashflowTimelinePoint[];
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
    sectionTitle: 'Receitas x Despesas',
    metaRows: [
      input.periodLabel,
      `Receitas ${formatDashboardCurrencyFromCents(input.totals.incomeCents)} · Despesas ${formatDashboardCurrencyFromCents(input.totals.expenseCents)} · Saldo ${formatDashboardCurrencyFromCents(input.totals.balanceCents)}`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Período', width: 28 },
    { header: 'Rec.', width: 26 },
    { header: 'Rec. prev.', width: 28 },
    { header: 'Desp.', width: 26 },
    { header: 'Desp. prev.', width: 28 },
    { header: 'Saldo', width: 26 },
    { header: 'Saldo prev.', width: contentWidth - 28 - 26 - 28 - 26 - 28 - 26 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  if (input.timeline.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum lançamento no período.', marginX, y);
    y += 6;
  } else {
    for (const point of input.timeline) {
      if (y > 270) {
        doc.addPage();
        y = 18;
        y = drawTableHeader(doc, cols, contentWidth, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      const values = [
        point.label,
        formatReais(point.incomePaid),
        formatReais(point.incomeForecast),
        formatReais(point.expensePaid),
        formatReais(point.expenseForecast),
        formatReais(point.balance),
        formatReais(point.balanceForecast),
      ];

      let x = marginX + 1;
      doc.setTextColor(40, 40, 40);
      values.forEach((value, index) => {
        const col = cols[index];
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
      y += 6;
    }
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
