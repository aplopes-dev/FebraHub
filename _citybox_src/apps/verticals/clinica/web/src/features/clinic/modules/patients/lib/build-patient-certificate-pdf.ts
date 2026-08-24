import { jsPDF } from 'jspdf';
import type { ProfessionalClinicalProfile } from './professional-council';
import { formatProfessionalCouncilLabel } from './professional-council';
import type { PatientAddress } from '../types/clinic-patient';
import type { PatientCertificateType } from '../types/patient-certificate';
import { formatPatientCpf } from './format-patient-contact';
import { formatPatientAddressTextWithoutCep } from './format-patient-profile';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfHorizontalRule,
  drawPatientPdfLabelValueLine,
  drawPatientPdfSectionHeading,
  drawPatientPdfWrappableLabelValueLine,
  formatPatientPdfDateLabel,
  loadClinicLogoForPdf,
  PATIENT_PDF_DETAIL_FONT_SIZE,
  PATIENT_PDF_DETAIL_LINE_HEIGHT,
  PATIENT_PDF_GAP_BETWEEN_SECTIONS,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from './patient-pdf-shared';

const CONTENT_TO_SIGNATURE_GAP = 120;
const EMPTY_PATIENT_ADDRESS: PatientAddress = {
  zipCode: '',
  street: '',
  streetNumber: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

type BuildPatientCertificatePdfInput = {
  patientName: string;
  patientCpf?: string;
  patientAddress?: PatientAddress;
  clinic?: PatientPdfClinicInfo;
  /** @deprecated Prefer `clinic` */
  clinicName?: string;
  professionalName: string;
  professionalProfile: ProfessionalClinicalProfile;
  type: PatientCertificateType;
  issuedDate: string;
  daysCount: string;
  startTime: string;
  endTime: string;
  cid: string;
  issuedAt?: Date;
};

function resolveClinic(input: BuildPatientCertificatePdfInput): PatientPdfClinicInfo {
  if (input.clinic) {
    return input.clinic;
  }

  return { clinicName: input.clinicName?.trim() || 'Clínica' };
}

function formatCertificateDocumentTitle(type: PatientCertificateType): string {
  return type === 'attendance' ? 'DECLARAÇÃO DE COMPARECIMENTO' : 'ATESTADO MÉDICO';
}

function formatPatientNameAndCpf(patientName: string, patientCpf?: string): string {
  const cpf = patientCpf?.trim() ? formatPatientCpf(patientCpf) : '—';
  return `${patientName} — ${cpf}`;
}

function formatTimeLabel(time: string): string {
  if (!time.trim()) {
    return '';
  }

  return time.replace(':', 'h');
}

function buildCertificateBody(input: BuildPatientCertificatePdfInput): string {
  const dateLabel = formatPatientPdfDateLabel(input.issuedDate);

  if (input.type === 'attendance') {
    const startLabel = formatTimeLabel(input.startTime);
    const endLabel = formatTimeLabel(input.endTime);
    const timeRange =
      startLabel && endLabel
        ? `, no horário das ${startLabel} às ${endLabel}`
        : '';

    return `Declaro, para os devidos fins, que o(a) paciente ${input.patientName} compareceu a consulta nesta data (${dateLabel})${timeRange}, sob meus cuidados profissionais.`;
  }

  const days = input.daysCount.trim();
  return `Atesto, para os devidos fins, que o(a) paciente ${input.patientName} necessita de afastamento de suas atividades por ${days} dia(s), a partir de ${dateLabel}.`;
}

function drawCertificatePatientSection(
  writer: PatientPdfWriter,
  patientName: string,
  patientCpf: string | undefined,
  patientAddress: PatientAddress,
): void {
  const { doc } = writer;

  writer.ensureSpace(6 + 2 * PATIENT_PDF_DETAIL_LINE_HEIGHT + 10);
  drawPatientPdfSectionHeading(writer, 'Paciente', { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);

  drawPatientPdfLabelValueLine(
    doc,
    PATIENT_PDF_PAGE_MARGIN_X,
    writer.cursorY,
    'Nome/CPF',
    formatPatientNameAndCpf(patientName, patientCpf),
  );
  writer.cursorY += PATIENT_PDF_DETAIL_LINE_HEIGHT;

  drawPatientPdfWrappableLabelValueLine(
    writer,
    'Endereço',
    formatPatientAddressTextWithoutCep(patientAddress),
  );
  writer.cursorY += PATIENT_PDF_GAP_BETWEEN_SECTIONS;
}

function drawCertificateBodySection(writer: PatientPdfWriter, body: string): void {
  const { doc, contentWidth } = writer;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
  doc.setTextColor(31, 41, 55);

  const lines = splitPatientPdfText(doc, body, contentWidth);
  for (const line of lines) {
    writer.ensureSpace(PATIENT_PDF_DETAIL_LINE_HEIGHT);
    doc.text(line, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }
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

  writer.ensureSpace(CONTENT_TO_SIGNATURE_GAP + 28);
  writer.cursorY += CONTENT_TO_SIGNATURE_GAP;

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

export async function buildPatientCertificatePdf({
  patientName,
  patientCpf,
  patientAddress = EMPTY_PATIENT_ADDRESS,
  clinic,
  clinicName,
  professionalName,
  professionalProfile,
  type,
  issuedDate,
  daysCount,
  startTime,
  endTime,
  cid,
  issuedAt: _issuedAt = new Date(),
}: BuildPatientCertificatePdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const clinicInfo = resolveClinic({
    patientName,
    patientCpf,
    patientAddress,
    clinic,
    clinicName,
    professionalName,
    professionalProfile,
    type,
    issuedDate,
    daysCount,
    startTime,
    endTime,
    cid,
  });
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: formatCertificateDocumentTitle(type),
    issuedAtLabel: formatPatientPdfDateLabel(issuedDate),
    logo,
  });

  drawCertificatePatientSection(writer, patientName, patientCpf, patientAddress);

  const body = buildCertificateBody({
    patientName,
    patientCpf,
    patientAddress,
    clinic: clinicInfo,
    professionalName,
    professionalProfile,
    type,
    issuedDate,
    daysCount,
    startTime,
    endTime,
    cid,
  });

  drawCertificateBodySection(writer, body);

  if (cid.trim()) {
    writer.cursorY += 2;
    const { doc: pdfDoc } = writer;
    writer.ensureSpace(PATIENT_PDF_DETAIL_LINE_HEIGHT);
    drawPatientPdfLabelValueLine(
      pdfDoc,
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY,
      'CID',
      cid.trim(),
    );
    writer.cursorY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }

  drawProfessionalSignatureBlock(writer, professionalName, professionalProfile);

  return doc.output('blob');
}

export function buildPatientCertificatePdfFileName(
  patientName: string,
  issuedAt: Date = new Date(),
): string {
  const datePart = issuedAt.toISOString().slice(0, 10);
  const slug = slugifyPatientPdfFileNamePart(patientName) || 'paciente';

  return `atestado-${slug}-${datePart}.pdf`;
}
