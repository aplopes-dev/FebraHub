import { jsPDF } from 'jspdf';
import type { PatientAddress } from '../types/clinic-patient';
import type { PatientGender } from '../types/patient-form';
import type {
  PatientAnamnesis,
  PatientAnamnesisAnswer,
  PatientAnamnesisQuestionSnapshot,
} from '../types/patient-anamnesis';
import { formatPatientPhone } from './format-patient-contact';
import { formatPatientBirthDate } from './format-patient-profile';
import { PATIENT_GENDER_LABEL } from './patient-ui';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfHorizontalRule,
  drawPatientPdfSectionHeading,
  drawPatientPdfSignatureSection,
  formatClinicPdfAddressLine,
  loadClinicLogoForPdf,
  mapClinicSettingsToPdfClinic,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_DETAIL_FONT_SIZE,
  PATIENT_PDF_DETAIL_LINE_HEIGHT,
  PATIENT_PDF_GAP_BETWEEN_SECTIONS,
  PATIENT_PDF_HEADER_FILL,
  PATIENT_PDF_PAGE_MARGIN_X,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from './patient-pdf-shared';

export type PatientAnamnesisPdfClinicInfo = PatientPdfClinicInfo;

export const mapClinicSettingsToAnamnesisPdfClinic = mapClinicSettingsToPdfClinic;

type BuildPatientAnamnesisPdfInput = {
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientGender?: PatientGender;
  patientAddress?: PatientAddress;
  anamnesis: PatientAnamnesis;
  clinic?: PatientAnamnesisPdfClinicInfo;
};

type AnamnesisQuestionAnswerRow = {
  question: string;
  answer: string;
};

const QA_TABLE_CELL_PADDING_X = 2.5;
const QA_TABLE_CELL_PADDING_Y = 2.5;
const QA_TABLE_ROW_LINE_HEIGHT = 4.2;
const QA_TABLE_FONT_SIZE = 9.5;
const QA_TABLE_QUESTION_COL_RATIO = 0.5;

function formatAnamnesisDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPatientAddressForPdf(address: PatientAddress): string {
  return (
    formatClinicPdfAddressLine({
      street: address.street,
      number: address.streetNumber,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      cep: address.zipCode,
    }) ?? '—'
  );
}

function formatTriState(value: NonNullable<PatientAnamnesisAnswer['triState']>): string {
  switch (value) {
    case 'yes':
      return 'Sim';
    case 'no':
      return 'Não';
    case 'unknown':
      return 'Não sei';
    default:
      return value;
  }
}

/** Rich-text answers (TipTap) arrive as HTML; PDFs must show plain text only. */
function htmlToPlainText(html: string | undefined): string {
  if (!html) {
    return '—';
  }

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || '—';
}

/** Exposed for unit tests — same rows drawn in the anamnesis PDF Q&A table. */
export function getPatientAnamnesisPdfQuestionAnswerRows(
  anamnesis: PatientAnamnesis,
): AnamnesisQuestionAnswerRow[] {
  return getQuestionAnswerRows(anamnesis);
}

function formatLateral(value: NonNullable<PatientAnamnesisAnswer['lateral']>): string {
  switch (value) {
    case 'left':
      return 'Esquerda';
    case 'right':
      return 'Direita';
    case 'unknown':
      return 'Não sei';
    default:
      return value;
  }
}

function formatAnswerValue(answer: PatientAnamnesisAnswer, question?: PatientAnamnesisQuestionSnapshot): string {
  const questionType = question?.type;

  if (questionType === 'rich_text' || questionType === 'text' || answer.text?.trim()) {
    return htmlToPlainText(answer.text);
  }

  if (questionType === 'left_right_unknown' && answer.lateral) {
    return formatLateral(answer.lateral);
  }

  if (questionType === 'single_choice' && answer.choiceValue) {
    const option = question?.options?.find((item) => item.value === answer.choiceValue);
    const label = option?.label ?? answer.choiceValue;
    if (answer.auxiliaryText?.trim()) {
      return `${label} — ${answer.auxiliaryText.trim()}`;
    }
    return label;
  }

  if (answer.triState) {
    const base = formatTriState(answer.triState);
    if (answer.auxiliaryText?.trim()) {
      return `${base} — ${answer.auxiliaryText.trim()}`;
    }
    return base;
  }

  return '—';
}

function getQuestionAnswerRows(anamnesis: PatientAnamnesis): AnamnesisQuestionAnswerRow[] {
  const rows: AnamnesisQuestionAnswerRow[] = [];

  if (anamnesis.consultationReason?.trim()) {
    rows.push({
      question: 'Qual o motivo da sua consulta?',
      answer: htmlToPlainText(anamnesis.consultationReason),
    });
  }

  const questionMap = new Map(
    (anamnesis.questionsSnapshot ?? []).map((question) => [question.id, question]),
  );

  for (const answer of anamnesis.answers ?? []) {
    if (answer.questionId === 'consultation-reason') {
      continue;
    }

    const question = questionMap.get(answer.questionId);
    rows.push({
      question: question?.text ?? 'Pergunta',
      answer: formatAnswerValue(answer, question),
    });
  }

  if (rows.length > 0) {
    return rows;
  }

  if (anamnesis.status !== 'issued') {
    return [
      {
        question: '—',
        answer: 'Esta anamnese ainda não possui respostas registradas.',
      },
    ];
  }

  return [{ question: '—', answer: 'Nenhuma resposta informada.' }];
}

const PATIENT_DATA_COLUMN_GAP = 8;

function wrapLabelValueLines(
  doc: jsPDF,
  label: string,
  value: string,
  columnWidth: number,
): { labelText: string; labelWidth: number; valueLines: string[] } {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);

  const labelText = `${label}: `;
  const labelWidth = doc.getTextWidth(labelText);
  const firstLineMaxWidth = Math.max(columnWidth - labelWidth, 12);
  const restLineMaxWidth = Math.max(columnWidth, 12);
  doc.setFont('helvetica', 'normal');
  const firstPass = splitPatientPdfText(doc, value, firstLineMaxWidth);
  const firstLine = firstPass[0] ?? '';
  const remainder = firstPass.slice(1).join(' ').trim();
  const valueLines = remainder
    ? [firstLine, ...splitPatientPdfText(doc, remainder, restLineMaxWidth)]
    : [firstLine];

  return {
    labelText,
    labelWidth,
    valueLines,
  };
}

function drawWrappableLabelValueAt(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  columnWidth: number,
): number {
  const { labelText, labelWidth, valueLines } = wrapLabelValueLines(
    doc,
    label,
    value,
    columnWidth,
  );

  doc.setTextColor(31, 41, 55);

  for (const [index, line] of valueLines.entries()) {
    const lineY = y + index * PATIENT_PDF_DETAIL_LINE_HEIGHT;
    if (index === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
      doc.text(labelText, x, lineY);
      doc.setFont('helvetica', 'normal');
      doc.text(line, x + labelWidth, lineY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
      doc.text(line, x, lineY);
    }
  }

  return y + valueLines.length * PATIENT_PDF_DETAIL_LINE_HEIGHT;
}

export function drawAnamnesisPatientDataSection(
  writer: PatientPdfWriter,
  input: {
    patientName: string;
    patientPhone?: string;
    patientBirthDate?: string;
    patientGender?: PatientGender;
    patientAddress?: PatientAddress;
  },
): void {
  const { doc, contentWidth } = writer;
  const phone = input.patientPhone?.trim() ? formatPatientPhone(input.patientPhone) : '—';
  const birthDate = input.patientBirthDate?.trim()
    ? formatPatientBirthDate(input.patientBirthDate)
    : '—';
  const gender = input.patientGender ? PATIENT_GENDER_LABEL[input.patientGender] : '—';
  const address = input.patientAddress
    ? formatPatientAddressForPdf(input.patientAddress)
    : '—';
  const columnWidth = (contentWidth - PATIENT_DATA_COLUMN_GAP) / 2;
  const leftX = PATIENT_PDF_PAGE_MARGIN_X;
  const rightX = leftX + columnWidth + PATIENT_DATA_COLUMN_GAP;
  const leftHeight =
    wrapLabelValueLines(doc, 'Nome', input.patientName, columnWidth).valueLines.length +
    wrapLabelValueLines(doc, 'Telefone', phone, columnWidth).valueLines.length +
    wrapLabelValueLines(doc, 'Nascimento', birthDate, columnWidth).valueLines.length;
  const rightHeight =
    wrapLabelValueLines(doc, 'Sexo', gender, columnWidth).valueLines.length +
    wrapLabelValueLines(doc, 'Endereço', address, columnWidth).valueLines.length;

  writer.ensureSpace(
    6 + Math.max(leftHeight, rightHeight) * PATIENT_PDF_DETAIL_LINE_HEIGHT + 10,
  );
  drawPatientPdfSectionHeading(writer, 'Dados do Paciente', { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);

  const startY = writer.cursorY;
  let leftY = drawWrappableLabelValueAt(
    doc,
    leftX,
    startY,
    'Nome',
    input.patientName,
    columnWidth,
  );
  leftY = drawWrappableLabelValueAt(doc, leftX, leftY, 'Telefone', phone, columnWidth);
  leftY = drawWrappableLabelValueAt(
    doc,
    leftX,
    leftY,
    'Nascimento',
    birthDate,
    columnWidth,
  );

  let rightY = drawWrappableLabelValueAt(doc, rightX, startY, 'Sexo', gender, columnWidth);
  rightY = drawWrappableLabelValueAt(doc, rightX, rightY, 'Endereço', address, columnWidth);

  writer.cursorY = Math.max(leftY, rightY) + PATIENT_PDF_GAP_BETWEEN_SECTIONS;
}

function getQuestionAnswerColumnWidths(contentWidth: number): {
  questionColWidth: number;
  answerColWidth: number;
  answerColX: number;
} {
  const questionColWidth = contentWidth * QA_TABLE_QUESTION_COL_RATIO;
  const answerColWidth = contentWidth - questionColWidth;
  const answerColX = PATIENT_PDF_PAGE_MARGIN_X + questionColWidth;

  return { questionColWidth, answerColWidth, answerColX };
}

function measureQuestionAnswerRowHeight(
  doc: jsPDF,
  row: AnamnesisQuestionAnswerRow,
  questionColWidth: number,
  answerColWidth: number,
): number {
  doc.setFontSize(QA_TABLE_FONT_SIZE);

  const questionInnerWidth = questionColWidth - QA_TABLE_CELL_PADDING_X * 2;
  const answerInnerWidth = answerColWidth - QA_TABLE_CELL_PADDING_X * 2;
  const questionLines = splitPatientPdfText(doc, row.question, questionInnerWidth);
  const answerLines = splitPatientPdfText(doc, row.answer, answerInnerWidth);
  const lineCount = Math.max(questionLines.length, answerLines.length, 1);

  return QA_TABLE_CELL_PADDING_Y * 2 + lineCount * QA_TABLE_ROW_LINE_HEIGHT;
}

function drawQuestionAnswerCellText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options?: { bold?: boolean },
): void {
  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
  doc.setFontSize(QA_TABLE_FONT_SIZE);
  doc.setTextColor(31, 41, 55);

  const lines = splitPatientPdfText(doc, text, maxWidth);
  let lineY = y;

  for (const line of lines) {
    doc.text(line, x, lineY);
    lineY += QA_TABLE_ROW_LINE_HEIGHT;
  }
}

function drawQuestionAnswerTableRow(
  writer: PatientPdfWriter,
  row: AnamnesisQuestionAnswerRow,
  options?: { header?: boolean },
): void {
  const { doc, contentWidth } = writer;
  const { questionColWidth, answerColWidth, answerColX } =
    getQuestionAnswerColumnWidths(contentWidth);
  const rowHeight = measureQuestionAnswerRowHeight(doc, row, questionColWidth, answerColWidth);

  writer.ensureSpace(rowHeight + 1);
  const rowTop = writer.cursorY;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setFillColor(...(options?.header ? PATIENT_PDF_HEADER_FILL : [255, 255, 255]));
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, rowTop, questionColWidth, rowHeight, 'FD');
  doc.rect(answerColX, rowTop, answerColWidth, rowHeight, 'FD');

  const textY = rowTop + QA_TABLE_CELL_PADDING_Y + 3.2;
  const questionTextX = PATIENT_PDF_PAGE_MARGIN_X + QA_TABLE_CELL_PADDING_X;
  const answerTextX = answerColX + QA_TABLE_CELL_PADDING_X;
  const questionInnerWidth = questionColWidth - QA_TABLE_CELL_PADDING_X * 2;
  const answerInnerWidth = answerColWidth - QA_TABLE_CELL_PADDING_X * 2;

  drawQuestionAnswerCellText(doc, row.question, questionTextX, textY, questionInnerWidth, {
    bold: options?.header,
  });
  drawQuestionAnswerCellText(doc, row.answer, answerTextX, textY, answerInnerWidth, {
    bold: options?.header,
  });

  writer.cursorY = rowTop + rowHeight;
}

function drawQuestionsAnswersSection(
  writer: PatientPdfWriter,
  rows: AnamnesisQuestionAnswerRow[],
): void {
  drawPatientPdfSectionHeading(writer, 'Perguntas e respostas', { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);

  drawQuestionAnswerTableRow(writer, { question: 'Pergunta', answer: 'Resposta' }, { header: true });

  for (const row of rows) {
    drawQuestionAnswerTableRow(writer, row);
  }

  writer.cursorY += 4;
}

export async function buildPatientAnamnesisPdf({
  patientName,
  patientPhone,
  patientBirthDate,
  patientGender,
  patientAddress,
  anamnesis,
  clinic,
}: BuildPatientAnamnesisPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientAnamnesisPdfClinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: 'FICHA DE ANAMNESE',
    issuedAtLabel: formatAnamnesisDate(anamnesis.issuedAt),
    logo,
  });
  drawAnamnesisPatientDataSection(writer, {
    patientName,
    patientPhone,
    patientBirthDate,
    patientGender,
    patientAddress,
  });
  drawQuestionsAnswersSection(writer, getQuestionAnswerRows(anamnesis));
  drawPatientPdfSignatureSection(writer, patientName);

  return doc.output('blob');
}

export function buildPatientAnamnesisPdfFileName(
  patientName: string,
  templateName: string,
  issuedAt: Date = new Date(),
): string {
  const datePart = issuedAt.toISOString().slice(0, 10);
  const patientSlug = patientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const templateSlug = templateName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return `anamnese-${patientSlug || 'paciente'}-${templateSlug || 'modelo'}-${datePart}.pdf`;
}
