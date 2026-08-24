import { jsPDF } from 'jspdf';
import type { ProfessionalClinicalProfile } from './professional-council';
import { formatProfessionalCouncilLabel } from './professional-council';
import type { PrescriptionItem } from '../types/patient-prescription';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfHorizontalRule,
  drawPatientPdfLabelValueSection,
  drawPatientPdfSectionHeading,
  formatPatientPdfDateLabel,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_DETAIL_FONT_SIZE,
  PATIENT_PDF_DETAIL_LINE_HEIGHT,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from './patient-pdf-shared';

const ITEM_CARD_FILL: [number, number, number] = [249, 250, 251];
const ITEM_CARD_PADDING = 4;
const ITEM_CARD_GAP = 4;
const BADGE_RADIUS = 2.75;
const BADGE_TO_CONTENT_GAP = 4;
const QUANTITY_INDENT = BADGE_RADIUS * 2 + 3;

type BuildPatientPrescriptionPdfInput = {
  patientName: string;
  clinic?: PatientPdfClinicInfo;
  /** @deprecated Prefer `clinic` */
  clinicName?: string;
  professionalName: string;
  professionalProfile: ProfessionalClinicalProfile;
  issuedDate: string;
  items: PrescriptionItem[];
  issuedAt?: Date;
};

function resolveClinic(input: BuildPatientPrescriptionPdfInput): PatientPdfClinicInfo {
  if (input.clinic) {
    return input.clinic;
  }

  return { clinicName: input.clinicName?.trim() || 'Clínica' };
}

function formatPrescriptionPatientAddress(addressLine?: string): string {
  const value = addressLine?.trim();
  if (!value) {
    return '—';
  }

  const withoutCep = value
    .replace(/\s*·\s*CEP\s+[\d.\-]+/gi, '')
    .replace(/\s*·\s*$/g, '')
    .trim();

  return withoutCep || '—';
}

function measurePrescriptionItemHeight(writer: PatientPdfWriter, item: PrescriptionItem): number {
  const { doc, contentWidth } = writer;
  const textWidth = contentWidth - ITEM_CARD_PADDING * 2 - QUANTITY_INDENT;
  let height = ITEM_CARD_PADDING + BADGE_RADIUS * 2 + BADGE_TO_CONTENT_GAP;

  height += PATIENT_PDF_DETAIL_LINE_HEIGHT;

  const posologyLines = splitPatientPdfText(doc, `Posologia: ${item.posology || '—'}`, textWidth);
  height += posologyLines.length * PATIENT_PDF_DETAIL_LINE_HEIGHT;

  if (item.notes.trim()) {
    const noteLines = splitPatientPdfText(doc, `Obs.: ${item.notes}`, textWidth);
    height += noteLines.length * PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }

  return height + ITEM_CARD_PADDING;
}

function drawPrescriptionItemCard(
  writer: PatientPdfWriter,
  item: PrescriptionItem,
  index: number,
): void {
  const { doc, contentWidth } = writer;
  const cardHeight = measurePrescriptionItemHeight(writer, item);

  writer.ensureSpace(cardHeight + ITEM_CARD_GAP);

  const cardX = PATIENT_PDF_PAGE_MARGIN_X;
  const cardY = writer.cursorY;
  const innerX = cardX + ITEM_CARD_PADDING;
  const textWidth = contentWidth - ITEM_CARD_PADDING * 2 - QUANTITY_INDENT;

  doc.setFillColor(...ITEM_CARD_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 2, 2, 'FD');

  let innerY = cardY + ITEM_CARD_PADDING;

  const badgeCenterX = innerX + BADGE_RADIUS;
  const badgeCenterY = innerY + BADGE_RADIUS;

  doc.setFillColor(17, 24, 39);
  doc.circle(badgeCenterX, badgeCenterY, BADGE_RADIUS, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(String(index + 1), badgeCenterX, badgeCenterY, { align: 'center', baseline: 'middle' });

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(item.name, innerX + QUANTITY_INDENT, badgeCenterY, { baseline: 'middle' });
  innerY = badgeCenterY + BADGE_RADIUS + BADGE_TO_CONTENT_GAP;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
  doc.setTextColor(55, 65, 81);
  doc.text(`Quantidade: ${item.quantity} ${item.measure}`, innerX + QUANTITY_INDENT, innerY);
  innerY += PATIENT_PDF_DETAIL_LINE_HEIGHT;

  const posologyLines = splitPatientPdfText(doc, `Posologia: ${item.posology || '—'}`, textWidth);
  for (const line of posologyLines) {
    doc.text(line, innerX + QUANTITY_INDENT, innerY);
    innerY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }

  if (item.notes.trim()) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    const noteLines = splitPatientPdfText(doc, `Obs.: ${item.notes}`, textWidth);
    for (const line of noteLines) {
      doc.text(line, innerX + QUANTITY_INDENT, innerY);
      innerY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
    }
  }

  writer.cursorY = cardY + cardHeight + ITEM_CARD_GAP;
}

function drawProfessionalSignatureBlock(
  writer: PatientPdfWriter,
  professionalName: string,
  professionalProfile: ProfessionalClinicalProfile,
): void {
  const { doc, contentWidth } = writer;
  const signatureWidth = 88;
  const lineStartX = PATIENT_PDF_PAGE_MARGIN_X + (contentWidth - signatureWidth) / 2;
  const lineEndX = lineStartX + signatureWidth;
  const centerX = lineStartX + signatureWidth / 2;

  writer.ensureSpace(28);
  writer.cursorY += 10;

  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.5);
  doc.line(lineStartX, writer.cursorY, lineEndX, writer.cursorY);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(professionalName, centerX, writer.cursorY + 5, { align: 'center' });

  const councilLabel = formatProfessionalCouncilLabel(professionalProfile);
  if (councilLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(councilLabel, centerX, writer.cursorY + 10, {
      align: 'center',
    });
  }

  writer.cursorY += 16;
}

export async function buildPatientPrescriptionPdf({
  patientName,
  clinic,
  clinicName,
  professionalName,
  professionalProfile,
  issuedDate,
  items,
  issuedAt: _issuedAt = new Date(),
}: BuildPatientPrescriptionPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const clinicInfo = resolveClinic({ patientName, clinic, clinicName, professionalName, professionalProfile, issuedDate, items });
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'RECEITUÁRIO',
    issuedAtLabel: formatPatientPdfDateLabel(issuedDate),
    logo,
  });

  drawPatientPdfLabelValueSection(writer, 'Paciente', [
    ['Nome', patientName],
    ['Endereço', formatPrescriptionPatientAddress(clinicInfo.addressLine)],
  ]);

  drawPatientPdfSectionHeading(writer, 'Prescrição', { gapAfter: 4 });
  drawPatientPdfHorizontalRule(writer);

  if (items.length === 0) {
    writer.ensureSpace(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum medicamento prescrito.', PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += 8;
  } else {
    items.forEach((item, index) => {
      drawPrescriptionItemCard(writer, item, index);
    });
  }

  drawProfessionalSignatureBlock(writer, professionalName, professionalProfile);

  return doc.output('blob');
}

export function buildPatientPrescriptionPdfFileName(
  patientName: string,
  issuedAt: Date = new Date(),
): string {
  const datePart = issuedAt.toISOString().slice(0, 10);
  const slug = slugifyPatientPdfFileNamePart(patientName) || 'paciente';

  return `receituario-${slug}-${datePart}.pdf`;
}
