import { jsPDF } from 'jspdf';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  PATIENT_PDF_PAGE_MARGIN_TOP,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type { DashboardAppointmentRow } from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';

export function buildDashboardAppointmentsPdfFileName(
  title: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `consultas-${slugifyPatientPdfFileNamePart(title)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export async function buildDashboardAppointmentsPdf(input: {
  title: string;
  periodLabel: string;
  appointments: readonly DashboardAppointmentRow[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'AGENDA',
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, [input.periodLabel], { title: input.title });

  let y = writer.cursorY + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Paciente', marginX, y);
  doc.text('Telefone', marginX + 55, y);
  doc.text('Data', marginX + 95, y);
  doc.text('Profissional', marginX + 120, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  for (const row of input.appointments) {
    if (y > 280) {
      doc.addPage();
      y = PATIENT_PDF_PAGE_MARGIN_TOP;
    }
    const patient =
      row.patientName.length > 26
        ? `${row.patientName.slice(0, 23)}...`
        : row.patientName;
    doc.text(patient, marginX, y);
    doc.text(formatPhone(row.phone) || '—', marginX + 55, y);
    doc.text(formatLocalDateBr(row.date), marginX + 95, y);
    const professional =
      row.professionalName.length > 28
        ? `${row.professionalName.slice(0, 25)}...`
        : row.professionalName;
    doc.text(professional, marginX + 120, y);
    y += 6;
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
