import { jsPDF } from 'jspdf';
import {
  calculatePatientBmi,
  formatPatientBmi,
  patientGenderToImcSilhouetteSex,
  patientImcSilhouetteSrc,
  resolvePatientImcStage,
} from '@/lib/patient-imc';
import {
  formatNutritionAnamnesisAnswer,
  parseNutritionInitAnamnesisSection,
} from './parse-nutrition-init-anamnesis';
import {
  NUTRITION_CELLULITE_GRADES,
  NUTRITION_FAT_DISTRIBUTION_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_TYPES,
  NUTRITION_SKINFOLDS,
  NUTRITION_STRETCH_MARKS,
  parseDecimalInput,
  parseNutritionBody,
  skinfoldMedian,
} from './nutrition-body-composition';
import { NUTRITION_GIRTHS } from './nutrition-girths';
import { nutritionAppearanceSilhouetteSrc } from './nutrition-appearance';
import {
  NUTRITION_TREATMENT_PLAN_FIELDS,
  parseNutritionTreatmentPlan,
} from './nutrition-treatment-plan-fields';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfHorizontalRule,
  drawPatientPdfPatientDataSection,
  drawPatientPdfSectionHeading,
  drawPatientPdfSignatureSection,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  PATIENT_PDF_LINE_HEIGHT,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  splitPatientPdfText,
  type PatientPdfClinicInfo,
  type PatientPdfImageAsset,
  type PatientPdfWriter,
} from './patient-pdf-shared';
import type { PatientNutritionInitPayload } from '../types/patient-nutrition-init';
import type { PatientNutritionNote } from '../types/patient-nutrition-note';
import { formatNutritionEvolutionDate } from './patient-nutrition-evolution-card';

type BuildPatientNutritionPdfInput = {
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientGender?: string | null;
  treatmentName: string;
  payload: PatientNutritionInitPayload;
  notes: readonly PatientNutritionNote[];
  clinic?: PatientPdfClinicInfo;
  issuedAt?: Date;
};

export type PatientNutritionPdfAttendance = Pick<
  BuildPatientNutritionPdfInput,
  'treatmentName' | 'payload' | 'notes'
>;

type BuildPatientNutritionEvolutionsPdfInput = Pick<
  BuildPatientNutritionPdfInput,
  | 'patientName'
  | 'patientPhone'
  | 'patientBirthDate'
  | 'patientGender'
  | 'clinic'
  | 'issuedAt'
> & {
  attendances: readonly PatientNutritionPdfAttendance[];
};

function htmlToText(html: string): string {
  if (!html.trim()) return '';
  const normalized = html
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<(br|\/p|\/div|\/h[1-6])\s*\/?>/gi, '\n');

  let text = normalized;
  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = normalized;
    text = element.textContent ?? '';
  }

  // Safety net: opening tags (ex. <p>) must never reach the PDF as literal text.
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function drawTextBlock(
  writer: PatientPdfWriter,
  label: string,
  value: string,
  options: { mutedWhenEmpty?: boolean } = {},
): void {
  const { doc, contentWidth } = writer;
  const text = value.trim() || (options.mutedWhenEmpty === false ? '' : 'Não informado');
  if (!text) return;
  const lines = splitPatientPdfText(doc, text, contentWidth);
  writer.ensureSpace(7 + Math.min(lines.length, 2) * PATIENT_PDF_LINE_HEIGHT);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(label, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
  writer.cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  if (value.trim()) {
    doc.setTextColor(31, 41, 55);
  } else {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  }
  lines.forEach((line) => {
    writer.ensureSpace(PATIENT_PDF_LINE_HEIGHT);
    doc.text(line, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
  });
  writer.cursorY += 2;
}

function drawSection(writer: PatientPdfWriter, title: string): void {
  writer.cursorY += 3;
  writer.ensureSpace(12);
  drawPatientPdfSectionHeading(writer, title, { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);
  writer.cursorY += 3;
}

function findOption<T extends { value: string; label: string; image: string }>(
  options: readonly T[],
  value: string,
): T | null {
  return options.find((option) => option.value === value) ?? null;
}

async function drawSelectedImage(
  writer: PatientPdfWriter,
  label: string,
  option: { label: string; image: string } | null,
): Promise<void> {
  if (!option) {
    drawTextBlock(writer, label, '');
    return;
  }

  const image = await loadClinicLogoForPdf(option.image);
  if (!image) {
    drawTextBlock(writer, label, option.label);
    return;
  }

  const maxWidth = 48;
  const maxHeight = 42;
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  writer.ensureSpace(height + 13);

  writer.doc.setFont('helvetica', 'bold');
  writer.doc.setFontSize(9);
  writer.doc.setTextColor(31, 41, 55);
  writer.doc.text(label, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
  writer.cursorY += 5;
  writer.doc.addImage(
    image.dataUrl,
    image.format,
    PATIENT_PDF_PAGE_MARGIN_X,
    writer.cursorY,
    width,
    height,
  );
  writer.doc.setFont('helvetica', 'normal');
  writer.doc.text(
    option.label,
    PATIENT_PDF_PAGE_MARGIN_X + width + 4,
    writer.cursorY + Math.min(height / 2, 8),
  );
  writer.cursorY += height + 4;
}

function drawAnamnesis(
  writer: PatientPdfWriter,
  payload: PatientNutritionInitPayload,
): void {
  const snapshot = parseNutritionInitAnamnesisSection(payload.anamnesis);
  drawSection(writer, 'ANAMNESE');

  if (!snapshot) {
    drawTextBlock(writer, 'Anamnese', '');
    return;
  }

  if (snapshot.templateName) {
    drawTextBlock(writer, 'Modelo', snapshot.templateName);
  }
  drawTextBlock(
    writer,
    'Motivo da consulta',
    htmlToText(snapshot.consultationReason),
  );

  const answersById = new Map(
    snapshot.answers.map((answer) => [answer.questionId, answer]),
  );
  snapshot.questions
    .filter((question) => !/queixa\s+principal/i.test(question.text))
    .forEach((question) => {
      drawTextBlock(
        writer,
        question.text,
        formatNutritionAnamnesisAnswer(question, answersById.get(question.id)),
      );
    });
}

async function drawBmi(
  writer: PatientPdfWriter,
  weightKg: string,
  heightCm: string,
  patientGender: string | null | undefined,
): Promise<void> {
  const weight = parseDecimalInput(weightKg);
  const height = parseDecimalInput(heightCm);
  const bmi = weight != null && height != null ? calculatePatientBmi(weight, height) : null;
  const stage = bmi != null ? resolvePatientImcStage(bmi) : null;

  drawTextBlock(writer, 'Peso', weightKg ? `${weightKg} kg` : '');
  drawTextBlock(writer, 'Altura', heightCm ? `${heightCm} cm` : '');
  if (bmi == null || !stage) {
    drawTextBlock(writer, 'IMC', '');
    return;
  }

  drawTextBlock(
    writer,
    'IMC',
    `${formatPatientBmi(bmi)} Kg/m² — Tipo de obesidade: ${stage.obesityTypeLabel} — Grau de risco: ${stage.riskGradeLabel}`,
  );
  const sex = patientGenderToImcSilhouetteSex(
    patientGender === 'female' ? 'female' : patientGender === 'male' ? 'male' : 'other',
  );
  await drawSelectedImage(writer, 'Silhueta do IMC', {
    label: `${formatPatientBmi(bmi)} Kg/m²`,
    image: patientImcSilhouetteSrc(stage.silhouetteVariant, sex),
  });
}

function drawSkinfolds(
  writer: PatientPdfWriter,
  payload: PatientNutritionInitPayload,
): void {
  const body = parseNutritionBody(payload.body);
  drawTextBlock(
    writer,
    'Protocolo de adipometria',
    body.adipometryProtocol === 'petroski' ? 'Petróski' : '',
  );

  NUTRITION_SKINFOLDS.forEach((skinfold) => {
    const measures = body.skinfolds[skinfold.id];
    const median = skinfoldMedian(measures);
    const values = [measures.first, measures.second, measures.third]
      .map((value) => value.trim() || '0,00')
      .join(' / ');
    drawTextBlock(
      writer,
      skinfold.label,
      `1ª / 2ª / 3ª: ${values} mm — Mediana: ${
        median == null
          ? '0,00'
          : median.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
      } mm`,
    );
  });

}

function drawGirths(
  writer: PatientPdfWriter,
  payload: PatientNutritionInitPayload,
): void {
  const body = parseNutritionBody(payload.body);
  NUTRITION_GIRTHS.forEach((girth) => {
    drawTextBlock(
      writer,
      girth.label,
      body.girths[girth.id] ? `${body.girths[girth.id]} mm` : '',
    );
  });
  body.customGirths.forEach((girth) => {
    drawTextBlock(writer, girth.label, girth.value ? `${girth.value} mm` : '');
  });
}

async function drawBody(
  writer: PatientPdfWriter,
  payload: PatientNutritionInitPayload,
  patientGender: string | null | undefined,
): Promise<void> {
  const body = parseNutritionBody(payload.body);
  const silhouetteSex = patientGenderToImcSilhouetteSex(
    patientGender === 'female' ? 'female' : patientGender === 'male' ? 'male' : 'other',
  );

  drawSection(writer, 'CORPORAL');
  await drawSelectedImage(
    writer,
    'Distribuição de gordura corporal',
    findOption(NUTRITION_FAT_DISTRIBUTION_OPTIONS, body.fatDistribution),
  );
  await drawBmi(writer, body.weightKg, body.heightCm, patientGender);

  drawSection(writer, 'ADIPOMETRIA');
  drawSkinfolds(writer, payload);

  drawSection(writer, 'PERIMETRIA');
  drawGirths(writer, payload);

  drawSection(writer, 'GRAU DE CELULITE');
  await drawSelectedImage(
    writer,
    'Grau de celulite',
    findOption(NUTRITION_CELLULITE_GRADES, body.celluliteGrade),
  );

  drawSection(writer, 'ESTRIAS');
  await drawSelectedImage(
    writer,
    'Estrias',
    findOption(NUTRITION_STRETCH_MARKS, body.stretchMarks),
  );

  drawSection(writer, 'OBSERVAÇÕES CORPORAIS');
  drawTextBlock(writer, 'Observações corporais', body.notes);

  drawSection(writer, 'DIÁSTASE DE RETO ABDOMINAL');
  await drawSelectedImage(
    writer,
    'Teste de diástase de reto abdominal',
    findOption(NUTRITION_RECTUS_DIASTASIS_OPTIONS, body.rectusDiastasis),
  );
  await drawSelectedImage(
    writer,
    'Tipo de diástase de reto abdominal',
    findOption(NUTRITION_RECTUS_DIASTASIS_TYPES, body.rectusDiastasisType),
  );
  drawTextBlock(writer, 'Observações da diástase', body.rectusDiastasisNotes);

  drawSection(writer, 'APARÊNCIA');
  await drawSelectedImage(
    writer,
    'Aparência percebida',
    body.perceivedAppearance
      ? {
          label: String(body.perceivedAppearance),
          image: nutritionAppearanceSilhouetteSrc(
            body.perceivedAppearance,
            silhouetteSex,
          ),
        }
      : null,
  );
  await drawSelectedImage(
    writer,
    'Aparência desejada',
    body.desiredAppearance
      ? {
          label: String(body.desiredAppearance),
          image: nutritionAppearanceSilhouetteSrc(
            body.desiredAppearance,
            silhouetteSex,
          ),
        }
      : null,
  );
}

function drawTreatmentPlan(
  writer: PatientPdfWriter,
  payload: PatientNutritionInitPayload,
): void {
  const plan = parseNutritionTreatmentPlan(payload.treatmentPlan);
  drawSection(writer, 'PLANO DE TRATAMENTO');
  NUTRITION_TREATMENT_PLAN_FIELDS.forEach((field) => {
    drawTextBlock(writer, field.label, htmlToText(plan[field.id]));
  });
}

async function drawNoteAttachment(
  writer: PatientPdfWriter,
  note: PatientNutritionNote,
): Promise<void> {
  const attachment = note.attachment;
  if (!attachment) return;
  drawTextBlock(writer, 'Arquivo anexado', attachment.name);
  if (!attachment.mimeType.startsWith('image/') || !attachment.contentUrl) return;

  const image = await loadClinicLogoForPdf(attachment.contentUrl);
  if (!image) return;
  const maxWidth = writer.contentWidth;
  const maxHeight = 90;
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  writer.ensureSpace(height + 4);
  writer.doc.addImage(
    image.dataUrl,
    image.format,
    PATIENT_PDF_PAGE_MARGIN_X,
    writer.cursorY,
    width,
    height,
  );
  writer.cursorY += height + 4;
}

async function drawNotes(
  writer: PatientPdfWriter,
  notes: readonly PatientNutritionNote[],
): Promise<void> {
  drawSection(writer, 'NOTAS');
  if (notes.length === 0) {
    drawTextBlock(writer, 'Notas do atendimento', '');
    return;
  }

  for (const note of notes) {
    drawTextBlock(
      writer,
      formatNutritionEvolutionDate(note.createdAt),
      htmlToText(note.content),
    );
    await drawNoteAttachment(writer, note);
    writer.cursorY += 2;
  }
}

async function drawNutritionAttendance({
  writer,
  patientName,
  patientPhone,
  patientBirthDate,
  patientGender,
  treatmentName,
  payload,
  notes,
  clinic,
  issuedAt,
  logo,
}: PatientNutritionPdfAttendance & {
  writer: PatientPdfWriter;
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientGender?: string | null;
  clinic: PatientPdfClinicInfo;
  issuedAt: Date;
  logo: PatientPdfImageAsset | null;
}): Promise<void> {
  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: 'ATENDIMENTO NUTRICIONAL',
    issuedAtLabel: formatPatientPdfDateTime(issuedAt),
    logo,
  });
  drawPatientPdfPatientDataSection(writer, {
    patientName,
    patientPhone,
    patientBirthDate,
  });
  drawTextBlock(writer, 'Procedimento', treatmentName);
  drawTextBlock(writer, 'Profissional', payload.professionalName);
  drawTextBlock(
    writer,
    'Data do atendimento',
    formatPatientPdfDateTime(new Date(payload.initiatedAt)),
  );

  drawAnamnesis(writer, payload);
  await drawBody(writer, payload, patientGender);
  drawTreatmentPlan(writer, payload);
  await drawNotes(writer, notes);
  drawPatientPdfSignatureSection(writer, patientName);
}

/**
 * Emissão detalhada de um ou mais atendimentos nutricionais. Cada atendimento
 * começa em uma página nova e recebe exatamente as mesmas seções do botão
 * "Baixar PDF" da visualização.
 */
export async function buildPatientNutritionEvolutionsPdf({
  patientName,
  patientPhone,
  patientBirthDate,
  patientGender,
  attendances,
  clinic,
  issuedAt = new Date(),
}: BuildPatientNutritionEvolutionsPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const clinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  for (const [index, attendance] of attendances.entries()) {
    if (index > 0) doc.addPage();

    await drawNutritionAttendance({
      writer: createPatientPdfWriter(doc),
      patientName,
      patientPhone,
      patientBirthDate,
      patientGender,
      clinic: clinicInfo,
      issuedAt,
      logo,
      ...attendance,
    });
  }

  return doc.output('blob');
}

export async function buildPatientNutritionPdf({
  treatmentName,
  payload,
  notes,
  ...document
}: BuildPatientNutritionPdfInput): Promise<Blob> {
  return buildPatientNutritionEvolutionsPdf({
    ...document,
    attendances: [{ treatmentName, payload, notes }],
  });
}
