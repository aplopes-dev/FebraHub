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
import type { DashboardBudgetRow } from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';
import { DASHBOARD_BUDGET_STATUS_LABEL } from './dashboard-budget-ui';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';

export type BuildDashboardBudgetsPdfInput = {
  budgets: DashboardBudgetRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export const mapClinicSettingsToDashboardPdfClinic = mapClinicSettingsToPdfClinic;

export function buildDashboardBudgetsPdfFileName(generatedAt = new Date()): string {
  const stamp = formatLocalDateString(generatedAt);
  return `orcamentos-abertos-reprovados-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export async function buildDashboardBudgetsPdf(
  input: BuildDashboardBudgetsPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'ORÇAMENTOS',
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, [`${input.budgets.length} registro(s)`], {
    title: 'Orçamentos em aberto e reprovados',
  });

  let y = writer.cursorY + 4;

  const cols = [
    { header: 'Data', width: 24 },
    { header: 'Paciente', width: 48 },
    { header: 'Descrição', width: 58 },
    { header: 'Status', width: 26 },
    { header: 'Valor', width: 26 },
  ] as const;

  const drawHeader = () => {
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
    y += 8;
  };

  drawHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const lineHeight = 4;

  for (const budget of input.budgets) {
    // Paciente e Descrição quebram em várias linhas dentro da própria coluna.
    const patientLines = doc.splitTextToSize(
      budget.patientName,
      cols[1].width - 4,
    ) as string[];
    const descriptionLines = doc.splitTextToSize(
      budget.description,
      cols[2].width - 4,
    ) as string[];
    const rowLines = Math.max(patientLines.length, descriptionLines.length, 1);
    const rowTextHeight = rowLines * lineHeight;

    if (y + rowTextHeight > 282) {
      doc.addPage();
      y = 18;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const singleLineValues: Array<string | null> = [
      formatLocalDateBr(budget.budgetDate),
      null,
      null,
      DASHBOARD_BUDGET_STATUS_LABEL[budget.status],
      formatBrlCurrencyFromCents(budget.valueCents),
    ];

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    cols.forEach((col, index) => {
      const multiline =
        index === 1 ? patientLines : index === 2 ? descriptionLines : null;
      if (multiline) {
        multiline.forEach((line, lineIndex) => {
          doc.text(line, x, y + lineIndex * lineHeight);
        });
      } else if (index === cols.length - 1) {
        doc.text(singleLineValues[index] ?? '', x + col.width - 2, y, {
          align: 'right',
        });
      } else {
        doc.text(singleLineValues[index] ?? '', x, y);
      }
      x += col.width;
    });

    y += rowTextHeight - lineHeight + 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  if (input.budgets.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum orçamento em aberto ou reprovado.', marginX, y);
    y += 6;
  }

  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
