import { jsPDF } from 'jspdf';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
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
  RevenueAggregateRow,
  RevenueAnalysisMode,
  RevenueDetailRow,
} from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';
import { formatRevenueValueLabel } from './revenue-analysis';

export type BuildRevenueAnalysisSummaryPdfInput = {
  title: string;
  modeLabel: string;
  periodLabel: string;
  dimensionLabel: string;
  mode: RevenueAnalysisMode;
  aggregates: RevenueAggregateRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export type BuildRevenueAnalysisDetailPdfInput = {
  title: string;
  modeLabel: string;
  periodLabel: string;
  itemName: string;
  mode: RevenueAnalysisMode;
  details: RevenueDetailRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export const mapClinicSettingsToRevenuePdfClinic = mapClinicSettingsToPdfClinic;

export function buildRevenueAnalysisSummaryPdfFileName(
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `analise-receitas-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export function buildRevenueAnalysisDetailPdfFileName(
  itemName: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `analise-receitas-${slugifyPatientPdfFileNamePart(itemName)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

type TableColumn = { header: string; width: number };

type DrawClinicDocumentShellInput = {
  doc: jsPDF;
  clinic?: PatientPdfClinicInfo;
  documentTitle: string;
  sectionTitle: string;
  metaRows: string[];
  generatedAt: Date;
};

async function drawClinicDocumentShell({
  doc,
  clinic,
  documentTitle,
  sectionTitle,
  metaRows,
  generatedAt,
}: DrawClinicDocumentShellInput): Promise<number> {
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle,
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, metaRows, { title: sectionTitle });

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
    // Value column is right-aligned in the rows; anchor the header the same way.
    if (index === cols.length - 1) {
      doc.text(col.header, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(col.header, x, y);
    }
    x += col.width;
  });
  return y + 8;
}

export async function buildRevenueAnalysisSummaryPdf(
  input: BuildRevenueAnalysisSummaryPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'RECEITAS',
    sectionTitle: input.title,
    metaRows: [
      `Por ${input.modeLabel} · ${input.periodLabel} · ${input.dimensionLabel}`,
      `${input.aggregates.length} item(ns)`,
    ],
    generatedAt,
  });

  const valueHeader = formatRevenueValueLabel(input.mode);
  // A largura da última coluna fecha exatamente na borda direita do conteúdo.
  const cols = [
    { header: 'Nome', width: 100 },
    { header: 'Qtd.', width: 24 },
    { header: valueHeader, width: contentWidth - 100 - 24 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of input.aggregates) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(doc, cols, contentWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const values = [
      row.name,
      String(row.count),
      formatBrlCurrencyFromCents(row.totalCents),
    ];

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    values.forEach((value, index) => {
      const col = cols[index];
      if (index === cols.length - 1) {
        doc.text(value, x + col.width - 2, y, { align: 'right' });
      } else {
        doc.text(value.length > 40 ? `${value.slice(0, 37)}...` : value, x, y);
      }
      x += col.width;
    });

    y += 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  if (input.aggregates.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum registro no período selecionado.', marginX, y);
    y += 6;
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export async function buildRevenueAnalysisDetailPdf(
  input: BuildRevenueAnalysisDetailPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  const dateHeader =
    input.mode === 'receipts' ? 'Data do pagamento' : 'Data da venda';
  const valueHeader =
    input.mode === 'receipts' ? 'Valor recebido' : 'Valor da venda';

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'RECEITAS',
    sectionTitle: `${input.title} — ${input.itemName}`,
    metaRows: [
      `Por ${input.modeLabel} · ${input.periodLabel}`,
      `${input.details.length} registro(s)`,
    ],
    generatedAt,
  });

  // A largura da última coluna fecha exatamente na borda direita do conteúdo.
  const cols = [
    { header: dateHeader, width: 34 },
    { header: 'Paciente', width: 56 },
    { header: 'Procedimento', width: 56 },
    { header: valueHeader, width: contentWidth - 34 - 56 - 56 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of input.details) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(doc, cols, contentWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const values = [
      formatLocalDateBr(row.date),
      row.patientName,
      row.treatmentName,
      formatBrlCurrencyFromCents(row.valueCents),
    ];

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    values.forEach((value, index) => {
      const col = cols[index];
      const text =
        value.length > 28 && (index === 1 || index === 2)
          ? `${value.slice(0, 25)}...`
          : value;
      if (index === cols.length - 1) {
        doc.text(text, x + col.width - 2, y, { align: 'right' });
      } else {
        doc.text(text, x, y);
      }
      x += col.width;
    });

    y += 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  if (input.details.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum registro no período selecionado.', marginX, y);
    y += 6;
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
