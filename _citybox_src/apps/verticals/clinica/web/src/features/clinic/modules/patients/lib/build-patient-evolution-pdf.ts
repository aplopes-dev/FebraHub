import { jsPDF } from 'jspdf';
import type { PatientTreatmentEvolution } from '../types/patient-treatment';
import { sortEvolutionsByDateDesc } from './patient-treatment-evolution';
import { formatPatientTreatmentFinalizedDate } from './patient-treatment-ui';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfHorizontalRule,
  drawPatientPdfPatientDataSection,
  drawPatientPdfSectionHeading,
  drawPatientPdfSignatureSection,
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
  formatPatientPdfDateTime,
} from './patient-pdf-shared';

export type PatientEvolutionPdfClinicInfo = PatientPdfClinicInfo;

export const mapClinicSettingsToEvolutionPdfClinic = mapClinicSettingsToPdfClinic;

type BuildPatientEvolutionPdfInput = {
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
  evolutions: PatientTreatmentEvolution[];
  clinic?: PatientEvolutionPdfClinicInfo;
  issuedAt?: Date;
};

function drawEvolutionsSection(
  writer: PatientPdfWriter,
  evolutions: PatientTreatmentEvolution[],
): void {
  const { doc, contentWidth } = writer;

  writer.cursorY += 2;
  drawPatientPdfSectionHeading(writer, 'Evoluções do Paciente', { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);

  if (evolutions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhuma evolução informada.', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
    return;
  }

  evolutions.forEach((evolution, index) => {
    if (index > 0) {
      writer.cursorY += 3;
    }

    const title = `${formatPatientTreatmentFinalizedDate(evolution.finalizedAt)} — ${evolution.description}`;
    const professionalLine = evolution.professionalName
      ? `Profissional: ${evolution.professionalName}`
      : '';
    const notesLines = splitPatientPdfText(
      doc,
      evolution.evolutionNotes.trim() || '—',
      contentWidth - 8,
    );

    const cardPaddingX = 4;
    const cardPaddingY = 3.5;
    const titleLines = splitPatientPdfText(doc, title, contentWidth - cardPaddingX * 2);
    const professionalLines = professionalLine
      ? splitPatientPdfText(doc, professionalLine, contentWidth - cardPaddingX * 2)
      : [];
    const cardHeight =
      cardPaddingY * 2 +
      titleLines.length * 4.5 +
      professionalLines.length * 4.2 +
      notesLines.length * 4.2 +
      (professionalLines.length > 0 ? 1.5 : 0) +
      2;

    writer.ensureSpace(cardHeight + 2);
    const cardTop = writer.cursorY;

    doc.setFillColor(252, 252, 253);
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.roundedRect(
      PATIENT_PDF_PAGE_MARGIN_X,
      cardTop,
      contentWidth,
      cardHeight,
      2,
      2,
      'FD',
    );

    let lineY = cardTop + cardPaddingY + 3.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    for (const line of titleLines) {
      doc.text(line, PATIENT_PDF_PAGE_MARGIN_X + cardPaddingX, lineY);
      lineY += 4.5;
    }

    if (professionalLines.length > 0) {
      lineY += 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
      for (const line of professionalLines) {
        doc.text(line, PATIENT_PDF_PAGE_MARGIN_X + cardPaddingX, lineY);
        lineY += 4.2;
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    for (const line of notesLines) {
      doc.text(line, PATIENT_PDF_PAGE_MARGIN_X + cardPaddingX, lineY);
      lineY += 4.2;
    }

    writer.cursorY = cardTop + cardHeight;
  });

  writer.cursorY += 4;
}

export async function buildPatientEvolutionPdf({
  patientName,
  patientPhone,
  patientBirthDate,
  evolutions,
  clinic,
  issuedAt = new Date(),
}: BuildPatientEvolutionPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientEvolutionPdfClinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);
  const sortedEvolutions = sortEvolutionsByDateDesc(evolutions);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'HISTÓRICO DE EVOLUÇÕES',
    issuedAtLabel: formatPatientPdfDateTime(issuedAt),
    logo,
  });
  drawPatientPdfPatientDataSection(writer, { patientName, patientPhone, patientBirthDate });
  drawEvolutionsSection(writer, sortedEvolutions);
  drawPatientPdfSignatureSection(writer, patientName);

  return doc.output('blob');
}

export function buildPatientEvolutionPdfFileName(
  patientName: string,
  issuedAt: Date = new Date(),
): string {
  const datePart = issuedAt.toISOString().slice(0, 10);
  const slug = slugifyPatientPdfFileNamePart(patientName) || 'paciente';

  return `evolucao-${slug}-${datePart}.pdf`;
}
