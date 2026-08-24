import { jsPDF } from 'jspdf';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatCpf } from '@/features/shared/fiscal/cpf';
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
import type { ReportOpenTreatmentsWithoutAppointmentRow } from '../types/clinic-reports';

const TABLE_HEADER_HEIGHT = 8;
const TABLE_ROW_HEIGHT = 7;
const TABLE_FONT_SIZE = 8;
const TABLE_HEADER_FILL: [number, number, number] = [243, 244, 246];

const TABLE_COLUMNS = [
  { header: 'Paciente', width: 55 },
  { header: 'Telefone', width: 40 },
  { header: 'Celular', width: 40 },
  { header: 'Documento', width: 47 },
] as const;

export type BuildReportsOpenTreatmentsPdfInput = {
  rows: readonly ReportOpenTreatmentsWithoutAppointmentRow[];
  clinic: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export function buildReportsOpenTreatmentsPdfFileName(
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `relatorio-procedimentos-abertos-sem-consulta-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

function getColumnX(columnIndex: number): number {
  let x = PATIENT_PDF_PAGE_MARGIN_X;
  for (let index = 0; index < columnIndex; index += 1) {
    x += TABLE_COLUMNS[index]?.width ?? 0;
  }
  return x;
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
    doc.text(column.header, getColumnX(index) + 2, top + 5.2);
  });

  writer.cursorY = top + TABLE_HEADER_HEIGHT;
}

/**
 * PDF do relatório Procedimentos abertos sem consulta com header da clínica
 * e tabela Paciente / Telefone / Celular / Documento.
 */
export async function buildReportsOpenTreatmentsPdf(
  input: BuildReportsOpenTreatmentsPdfInput,
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
    documentTitle: 'RELATÓRIO',
    issuedAtLabel: formatPatientPdfDateLabel(
      formatLocalDateString(generatedAt),
    ),
    logo,
    stampCornerDate: false,
  });

  drawPatientPdfMetaRows(
    writer,
    [`Total: ${input.rows.length} paciente(s)`],
    { title: 'Procedimentos abertos sem consulta' },
  );

  let lastPage = doc.getNumberOfPages();
  drawTableHead(writer);

  if (input.rows.length === 0) {
    writer.ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(
      'Nenhum paciente com procedimento aberto sem consulta.',
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
        row.patientName || '—',
        formatPhone(row.phone) || row.phone || '—',
        formatPhone(row.mobile) || row.mobile || '—',
        formatCpf(row.document) || row.document || '—',
      ];

      const top = writer.cursorY;
      doc.setTextColor(40, 40, 40);
      values.forEach((value, index) => {
        const text = value.length > 36 ? `${value.slice(0, 33)}...` : value;
        doc.text(text, getColumnX(index) + 2, top + 5);
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
