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
  BudgetAnalysisAggregate,
  BudgetChartMetric,
  BudgetStatusSummary,
  DashboardBudgetAnalysisRow,
} from '../types/clinic-dashboard';
import { BUDGET_STATUS_LABELS } from './budget-analysis';
import { formatLocalDateBr } from './dashboard-dates';

export const mapClinicSettingsToBudgetAnalysisPdfClinic =
  mapClinicSettingsToPdfClinic;

const generatedStamp = (date: Date) =>
  slugifyPatientPdfFileNamePart(formatLocalDateString(date));

export function buildBudgetStatusPdfFileName(date = new Date()): string {
  return `status-orcamentos-${generatedStamp(date)}.pdf`;
}

export function buildBudgetAnalysisPdfFileName(
  suffix: string,
  date = new Date(),
): string {
  return `analise-orcamentos-${slugifyPatientPdfFileNamePart(suffix)}-${generatedStamp(date)}.pdf`;
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
    if (index === cols.length - 1) {
      doc.text(col.header, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(col.header, x, y);
    }
    x += col.width;
  });
  return y + 8;
}

function drawSimpleRows(
  doc: jsPDF,
  cols: readonly TableColumn[],
  contentWidth: number,
  startY: number,
  rows: string[][],
  options?: { rightAlignLast?: boolean },
): number {
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const rightAlignLast = options?.rightAlignLast ?? true;
  let y = startY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of rows) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(doc, cols, contentWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    row.forEach((value, index) => {
      const col = cols[index];
      if (!col) return;
      const text = value.length > 42 ? `${value.slice(0, 39)}...` : value;
      if (rightAlignLast && index === cols.length - 1) {
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

  return y;
}

export async function buildBudgetStatusPdf(input: {
  summary: BudgetStatusSummary;
  metric: BudgetChartMetric;
  periodLabel: string;
  professionalLabel: string;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  const metricHeader =
    input.metric === 'quantity' ? 'Quantidade' : 'Valor';
  const valueFor = (status: 'approved' | 'rejected' | 'open') =>
    input.metric === 'quantity'
      ? String(input.summary[status].count)
      : formatBrlCurrencyFromCents(input.summary[status].totalCents);

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'ORÇAMENTOS',
    sectionTitle: 'Status dos Orçamentos',
    metaRows: [
      `${input.periodLabel} · ${input.professionalLabel}`,
      `Taxa de aprovação: ${input.summary.approvalRate.toFixed(1)}%`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Status', width: 110 },
    { header: metricHeader, width: contentWidth - 110 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  y = drawSimpleRows(doc, cols, contentWidth, y, [
    ['Aprovados', valueFor('approved')],
    ['Reprovados', valueFor('rejected')],
    ['Em aberto', valueFor('open')],
  ]);

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export async function buildBudgetAnalysisSummaryPdf(input: {
  title: string;
  periodLabel: string;
  professionalLabel: string;
  aggregates: BudgetAnalysisAggregate[];
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
    documentTitle: 'ORÇAMENTOS',
    sectionTitle: input.title,
    metaRows: [
      `${input.periodLabel} · ${input.professionalLabel}`,
      `${input.aggregates.length} item(ns)`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Nome', width: 100 },
    { header: 'Orçamentos', width: 28 },
    { header: 'Valor', width: contentWidth - 100 - 28 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  y = drawSimpleRows(
    doc,
    cols,
    contentWidth,
    y,
    input.aggregates.map((item) => [
      item.name,
      String(item.count),
      formatBrlCurrencyFromCents(item.totalCents),
    ]),
  );

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

export async function buildBudgetAnalysisDetailPdf(input: {
  title: string;
  budgets: DashboardBudgetAnalysisRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  const totalCents = input.budgets.reduce(
    (total, budget) => total + budget.valueCents,
    0,
  );

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'ORÇAMENTOS',
    sectionTitle: input.title,
    metaRows: [
      `${input.budgets.length} orçamento(s)`,
      `Total: ${formatBrlCurrencyFromCents(totalCents)}`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Dt. Orçamento', width: 28 },
    { header: 'Paciente', width: 42 },
    { header: 'Descrição', width: 52 },
    { header: 'Status', width: 26 },
    { header: 'Valor', width: contentWidth - 28 - 42 - 52 - 26 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  y = drawSimpleRows(
    doc,
    cols,
    contentWidth,
    y,
    input.budgets.map((budget) => [
      formatLocalDateBr(budget.budgetDate),
      budget.patientName,
      budget.description,
      BUDGET_STATUS_LABELS[budget.status],
      formatBrlCurrencyFromCents(budget.valueCents),
    ]),
  );

  if (input.budgets.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum orçamento encontrado.', marginX, y);
    y += 6;
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
