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
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import type {
  DashboardAcquisitionAggregate,
  DashboardAcquisitionPatient,
} from '../types/clinic-dashboard';
import { formatLocalDateBr } from './dashboard-dates';

export const mapClinicSettingsToPatientAcquisitionPdfClinic =
  mapClinicSettingsToPdfClinic;

export function buildDashboardPatientAcquisitionSummaryPdfFileName(
  periodLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `origem-pacientes-${slugifyPatientPdfFileNamePart(periodLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export function buildDashboardPatientAcquisitionDetailPdfFileName(
  sourceLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `origem-${slugifyPatientPdfFileNamePart(sourceLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
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

export async function buildDashboardPatientAcquisitionSummaryPdf(input: {
  periodLabel: string;
  aggregates: DashboardAcquisitionAggregate[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const totalCount = input.aggregates.reduce((sum, row) => sum + row.count, 0);

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'PACIENTES',
    sectionTitle: 'Como o paciente chegou na clínica',
    metaRows: [
      input.periodLabel,
      `${totalCount} paciente(s) · ${input.aggregates.length} origem(ns)`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Origem', width: 100 },
    { header: 'Pacientes', width: 36 },
    { header: '%', width: contentWidth - 100 - 36 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of input.aggregates) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(doc, cols, contentWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const values = [
      row.label,
      String(row.count),
      `${row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
    ];

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
    y += 7;
  }

  if (input.aggregates.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum paciente cadastrado no período.', marginX, y);
    y += 6;
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}

export async function buildDashboardPatientAcquisitionDetailPdf(input: {
  sourceLabel: string;
  periodLabel: string;
  patients: DashboardAcquisitionPatient[];
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
}): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = input.generatedAt ?? new Date();
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  let y = await drawClinicDocumentShell({
    doc,
    clinic: input.clinic,
    documentTitle: 'PACIENTES',
    sectionTitle: `Origem: ${input.sourceLabel}`,
    metaRows: [
      input.periodLabel,
      `${input.patients.length} paciente(s)`,
    ],
    generatedAt,
  });

  const cols = [
    { header: 'Paciente', width: 70 },
    { header: 'Telefone', width: 42 },
    { header: 'Cadastro', width: contentWidth - 70 - 42 },
  ] as const;

  y = drawTableHeader(doc, cols, contentWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const patient of input.patients) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(doc, cols, contentWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const values = [
      patient.name,
      formatPhone(patient.phone) || patient.phone || '—',
      formatLocalDateBr(patient.registeredAt),
    ];

    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    values.forEach((value, index) => {
      const col = cols[index];
      const text =
        index === 0 && value.length > 36
          ? `${value.slice(0, 33)}...`
          : value;
      if (index === cols.length - 1) {
        doc.text(text, x + col.width - 2, y, { align: 'right' });
      } else {
        doc.text(text, x, y);
      }
      x += col.width;
    });

    y += 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  if (input.patients.length === 0) {
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text('Nenhum paciente encontrado.', marginX, y);
    y += 6;
  }

  const writer = createPatientPdfWriter(doc);
  writer.cursorY = y;
  drawPatientPdfFooter(writer, generatedAt);

  return doc.output('blob');
}
