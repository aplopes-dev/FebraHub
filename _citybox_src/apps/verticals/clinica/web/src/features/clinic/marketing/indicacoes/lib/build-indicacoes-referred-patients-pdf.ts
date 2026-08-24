import { jsPDF } from 'jspdf';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateLabel,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
  type PatientPdfWriter,
} from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { formatLocalDateBr } from '@/features/clinic/modules/dashboard/lib/dashboard-dates';
import { formatFirstAppointmentStatusLabel } from './format-first-appointment-status';
import type { IndicacoesReferredPatient } from '../types/indicacoes';

const TABLE_HEADER_HEIGHT = 7;
const TABLE_ROW_HEIGHT = 6;
const TABLE_FONT_SIZE = 7;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

const TABLE_COLUMNS = [
  { header: 'Paciente indicado', width: 36 },
  { header: 'Quem indicou', width: 32 },
  { header: 'Data indicação', width: 24 },
  { header: '1ª consulta', width: 36 },
  { header: 'Orç. aprovados', width: 24 },
] as const;

export type BuildIndicacoesReferredPatientsPdfInput = {
  rows: readonly IndicacoesReferredPatient[];
  periodLabel: string;
  clinic: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export function buildIndicacoesReferredPatientsPdfFileName(
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `indicacoes-pacientes-indicados-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

function getColumnX(columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += TABLE_COLUMNS[index]?.width ?? 0;
  }
  return x;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 3))}...`;
}

function formatFirstAppointmentCell(row: IndicacoesReferredPatient): string {
  const status = formatFirstAppointmentStatusLabel(row.firstAppointmentStatus);
  if (!row.firstAppointmentDate) return status;
  return `${status} (${formatLocalDateBr(row.firstAppointmentDate)})`;
}

function drawTableHead(writer: PatientPdfWriter): void {
  const { doc, contentWidth } = writer;
  writer.ensureSpace(TABLE_HEADER_HEIGHT + 4);
  const top = writer.cursorY;

  doc.setFillColor(...TABLE_HEADER_FILL);
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.rect(PATIENT_PDF_PAGE_MARGIN_X, top, contentWidth, TABLE_HEADER_HEIGHT, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setTextColor(17, 24, 39);

  TABLE_COLUMNS.forEach((column, index) => {
    doc.text(column.header, getColumnX(index) + 1, top + 4.6);
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

/** PDF da lista Pacientes indicados (Marketing → Indicações). */
export async function buildIndicacoesReferredPatientsPdf(
  input: BuildIndicacoesReferredPatientsPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const writer = createPatientPdfWriter(doc);
  const generatedAt = input.generatedAt ?? new Date();
  const clinic: PatientPdfClinicInfo = {
    ...input.clinic,
    clinicName: input.clinic.clinicName.trim() || 'Clínica',
  };
  const logo = await loadClinicLogoForPdf(clinic.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic,
    documentTitle: 'INDICAÇÕES',
    issuedAtLabel: formatPatientPdfDateLabel(
      formatLocalDateString(generatedAt),
    ),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(
    writer,
    [
      `Período: ${input.periodLabel}`,
      `Total: ${input.rows.length} paciente(s)`,
    ],
    { title: 'Pacientes indicados' },
  );

  let lastPage = doc.getNumberOfPages();
  drawTableHead(writer);

  if (input.rows.length === 0) {
    writer.ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      'Nenhum paciente indicado no período selecionado.',
      PATIENT_PDF_PAGE_MARGIN_X,
      writer.cursorY + 5,
    );
    writer.cursorY += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TABLE_FONT_SIZE);

    for (const row of input.rows) {
      writer.ensureSpace(TABLE_ROW_HEIGHT + 2);
      if (doc.getNumberOfPages() !== lastPage) {
        lastPage = doc.getNumberOfPages();
        drawTableHead(writer);
      }

      const values = [
        truncate(row.name || '—', 22),
        truncate(row.referredBy || '—', 20),
        formatLocalDateBr(row.referralDate),
        truncate(formatFirstAppointmentCell(row), 22),
        String(row.approvedBudgetsCount),
      ];

      const top = writer.cursorY;
      doc.setTextColor(40, 40, 40);
      values.forEach((value, index) => {
        doc.text(value, getColumnX(index) + 1, top + 4.2);
      });

      writer.cursorY = top + TABLE_ROW_HEIGHT;
      doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
      doc.line(
        PATIENT_PDF_PAGE_MARGIN_X,
        writer.cursorY,
        PATIENT_PDF_PAGE_MARGIN_X + writer.contentWidth,
        writer.cursorY,
      );
    }
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
