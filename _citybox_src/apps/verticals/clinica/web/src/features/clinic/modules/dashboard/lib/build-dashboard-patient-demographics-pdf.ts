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
import type {
  DashboardAgeSeriesPoint,
  DashboardGenderShare,
} from '../types/clinic-dashboard';

export const mapClinicSettingsToPatientDemographicsPdfClinic =
  mapClinicSettingsToPdfClinic;

export function buildDashboardPatientDemographicsPdfFileName(
  genderFilterLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `pacientes-idade-sexo-${slugifyPatientPdfFileNamePart(genderFilterLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

type TableColumn = { header: string; width: number };

type DrawClinicDocumentShellInput = {
  doc: jsPDF;
  clinic?: PatientPdfClinicInfo;
  documentTitle: string;
  sectionTitle: string;
  metaRows: string[];
  generatedAt: Date;
};

async function drawClinicDocumentShell({
  doc,
  clinic,
  documentTitle,
  sectionTitle,
  metaRows,
  generatedAt,
}: DrawClinicDocumentShellInput): Promise<number> {
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = clinic ?? { clinicName: 'Clínica' };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle,
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, metaRows, { title: sectionTitle });

  return writer.cursorY + 4;
}

function drawTableHeader(
  doc: jsPDF,
  cols: readonly TableColumn[],
  contentWidth: number,
  y: number,
): number {
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  doc.setFillColor(243, 244, 246);
  doc.rect(marginX, y - 4, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  let x = marginX + 1;
  cols.forEach((col, index) => {
    if (index === cols.length - 1) {
      doc.text(col.header, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(col.header, x, y);
    }
    x += col.width;
  });
  return y + 8;
}

function drawDataRow(
  doc: jsPDF,
  cols: readonly TableColumn[],
  values: string[],
  contentWidth: number,
  y: number,
): number {
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  let x = marginX + 1;
  doc.setTextColor(40, 40, 40);
  values.forEach((value, index) => {
    const col = cols[index];
    if (index === cols.length - 1) {
      doc.text(value, x + col.width - 2, y, { align: 'right' });
    } else {
      doc.text(value, x, y);
    }
    x += col.width;
  });
  y += 2;
  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
  return y + 7;
}

export async function buildDashboardPatientDemographicsPdf(input: {
  genderFilterLabel: string;
  ageSeries: DashboardAgeSeriesPoint[];
  genderShares: DashboardGenderShare[];
  filteredTotalCount: number;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const ageRows = input.ageSeries.filter((point) => point.count > 0);

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'PACIENTES',
    sectionTitle: 'Pacientes por idade e sexo',
    metaRows: [
      `Filtro de sexo (idade): ${input.genderFilterLabel}`,
      `${input.filteredTotalCount} paciente(s)`,
    ],
    generatedAt,
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Por idade', marginX, y);
  y += 6;

  const ageCols = [
    { header: 'Idade', width: 70 },
    { header: 'Pacientes', width: 36 },
    { header: '%', width: contentWidth - 70 - 36 },
  ] as const;

  y = drawTableHeader(doc, ageCols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (ageRows.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum paciente no filtro de sexo atual.', marginX, y);
    y += 8;
  } else {
    for (const row of ageRows) {
      if (y > 270) {
        doc.addPage();
        y = 18;
        y = drawTableHeader(doc, ageCols, contentWidth, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      y = drawDataRow(
        doc,
        ageCols,
        [
          row.label,
          String(row.count),
          `${row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
        ],
        contentWidth,
        y,
      );
    }
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Por sexo', marginX, y);
  y += 6;

  const genderCols = [
    { header: 'Sexo', width: 70 },
    { header: 'Pacientes', width: 36 },
    { header: '%', width: contentWidth - 70 - 36 },
  ] as const;

  y = drawTableHeader(doc, genderCols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (input.genderShares.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum paciente ativo cadastrado.', marginX, y);
    y += 6;
  } else {
    for (const share of input.genderShares) {
      if (y > 270) {
        doc.addPage();
        y = 18;
        y = drawTableHeader(doc, genderCols, contentWidth, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      y = drawDataRow(
        doc,
        genderCols,
        [
          share.label,
          String(share.count),
          `${share.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
        ],
        contentWidth,
        y,
      );
    }
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
