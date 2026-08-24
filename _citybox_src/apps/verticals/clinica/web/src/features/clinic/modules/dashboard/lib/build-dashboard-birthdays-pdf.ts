import { jsPDF } from 'jspdf';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_TOP,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type { BirthdayListItem } from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';

export type BuildDashboardBirthdaysPdfInput = {
  items: BirthdayListItem[];
  periodLabel: string;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export function buildDashboardBirthdaysPdfFileName(generatedAt = new Date()): string {
  const stamp = formatLocalDateString(generatedAt);
  return `aniversariantes-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export async function buildDashboardBirthdaysPdf(
  input: BuildDashboardBirthdaysPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const contentWidth = writer.contentWidth;

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'ANIVERSARIANTES',
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(
    writer,
    [`Período: ${input.periodLabel}`, `Total: ${input.items.length} paciente(s)`],
    { title: 'Aniversariantes' },
  );

  let y = writer.cursorY + 4;

  const cols = [
    { header: 'Paciente', width: 55 },
    { header: 'Telefone', width: 38 },
    { header: 'Nascimento', width: 28 },
    { header: 'Situação', width: 61 },
  ] as const;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX, y - 4, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    let x = marginX + 1;
    for (const col of cols) {
      doc.text(col.header, x, y);
      x += col.width;
    }
    y += 8;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const item of input.items) {
    if (y > 280) {
      doc.addPage();
      y = PATIENT_PDF_PAGE_MARGIN_TOP;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const values = [
      item.name,
      formatPhone(item.phone) || item.phone || '—',
      formatLocalDateBr(item.birthDate),
      item.relativeLabel,
    ];

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    values.forEach((value, index) => {
      const col = cols[index];
      const text = value.length > 36 ? `${value.slice(0, 33)}...` : value;
      doc.text(text, x, y);
      x += col.width;
    });

    y += 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  if (input.items.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum aniversariante no período selecionado.', marginX, y);
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
