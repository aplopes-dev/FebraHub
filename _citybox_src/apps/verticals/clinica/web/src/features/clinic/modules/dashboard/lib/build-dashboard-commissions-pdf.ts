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
import type { DashboardCommissionPaidRow } from '../types/clinic-dashboard';
import { formatDashboardCurrencyFromCents } from './format-dashboard-currency';
import { formatLocalDateBr } from './dashboard-dates';
import {
  groupCommissionsByRule,
  summarizeCommissionNetTotal,
} from './dashboard-commissions';

export const mapClinicSettingsToCommissionsPdfClinic =
  mapClinicSettingsToPdfClinic;

export function buildDashboardCommissionsPdfFileName(
  title: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `comissoes-pagas-${slugifyPatientPdfFileNamePart(title)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

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

export async function buildDashboardCommissionsPdf(input: {
  title: string;
  periodLabel: string;
  rows: readonly DashboardCommissionPaidRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const totalNet = summarizeCommissionNetTotal(input.rows);

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'FINANCEIRO',
    sectionTitle: input.title,
    metaRows: [
      input.periodLabel,
      `Total pago ${formatDashboardCurrencyFromCents(totalNet)}`,
    ],
    generatedAt,
  });

  const groups = groupCommissionsByRule(input.rows);

  if (groups.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhuma comissão no período.', marginX, y);
  } else {
    for (const group of groups) {
      if (y > 250) {
        doc.addPage();
        y = 18;
      }

      const header = `${group.triggerLabel} - Plano ${group.planName} › Especialidade ${group.specialtyName} › Procedimento ${group.treatmentSummary}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const headerLines = doc.splitTextToSize(header, 140);
      doc.text(headerLines, marginX, y);
      doc.text(
        formatDashboardCurrencyFromCents(group.totalNetCents),
        marginX + 165,
        y,
      );
      y += Math.max(headerLines.length * 4.5, 5) + 2;

      const groupHasInstallment = group.rows.some(
        (row) => row.installment != null,
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Pago em', marginX, y);
      doc.text('Paciente', marginX + 22, y);
      doc.text('Procedimento', marginX + 52, y);
      doc.text('Valor trat.', marginX + 95, y);
      doc.text('Custo', marginX + 120, y);
      if (groupHasInstallment) {
        doc.text('Parc.', marginX + 140, y);
        doc.text('Comissão', marginX + 155, y);
      } else {
        doc.text('Comissão', marginX + 145, y);
      }
      y += 5;
      doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
      doc.line(marginX, y - 2, marginX + 180, y - 2);

      doc.setFont('helvetica', 'normal');
      for (const row of group.rows) {
        if (y > 275) {
          doc.addPage();
          y = 18;
        }
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7);
        doc.text(formatLocalDateBr(row.paidAt), marginX, y);
        doc.text(row.patientName.slice(0, 18), marginX + 22, y);
        doc.text(row.treatmentName.slice(0, 22), marginX + 52, y);
        doc.text(
          formatDashboardCurrencyFromCents(row.treatmentValueCents),
          marginX + 95,
          y,
        );
        doc.text(
          formatDashboardCurrencyFromCents(row.treatmentCostCents),
          marginX + 120,
          y,
        );
        if (groupHasInstallment) {
          doc.text(row.installment ?? '—', marginX + 140, y);
          doc.text(
            formatDashboardCurrencyFromCents(row.netCents),
            marginX + 155,
            y,
          );
        } else {
          doc.text(
            formatDashboardCurrencyFromCents(row.netCents),
            marginX + 145,
            y,
          );
        }
        y += 5;
      }
      y += 4;
    }
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
