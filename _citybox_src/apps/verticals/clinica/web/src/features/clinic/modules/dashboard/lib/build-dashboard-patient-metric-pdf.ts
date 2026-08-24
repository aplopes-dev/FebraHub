import { jsPDF } from "jspdf";
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  formatPatientPdfDateTime,
  loadClinicLogoForPdf,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_PAGE_MARGIN_TOP,
  PATIENT_PDF_PAGE_MARGIN_X,
  slugifyPatientPdfFileNamePart,
  type PatientPdfClinicInfo,
} from "@/features/clinic/modules/patients/lib/patient-pdf-shared";
import { formatPhone } from "@/features/clinic/modules/settings/lib/format-clinic-fields";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";
import type { DashboardPatientMetricItem } from "../types/clinic-dashboard";
import { formatDashboardCurrencyFromCents } from "./format-dashboard-currency";

export type BuildDashboardPatientMetricPdfInput = {
  metricLabel: string;
  patients: DashboardPatientMetricItem[];
  showValueColumn: boolean;
  clinic?: PatientPdfClinicInfo;
  generatedAt?: Date;
};

export function buildDashboardPatientMetricPdfFileName(
  metricLabel: string,
  generatedAt = new Date(),
): string {
  const stamp = formatLocalDateString(generatedAt);
  return `${slugifyPatientPdfFileNamePart(metricLabel)}-${slugifyPatientPdfFileNamePart(stamp)}.pdf`;
}

export async function buildDashboardPatientMetricPdf(
  input: BuildDashboardPatientMetricPdfInput,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const generatedAt = input.generatedAt ?? new Date();
  const writer = createPatientPdfWriter(doc);
  const clinicInfo: PatientPdfClinicInfo = input.clinic ?? { clinicName: "Clínica" };
  const logo = await loadClinicLogoForPdf(clinicInfo.logoUrl);
  const marginX = PATIENT_PDF_PAGE_MARGIN_X;
  const contentWidth = writer.contentWidth;
  const hasValues = input.showValueColumn;

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo,
    documentTitle: "PACIENTES",
    issuedAtLabel: formatPatientPdfDateTime(generatedAt),
    logo,
    stampCornerDate: false,
  });
  drawPatientPdfMetaRows(writer, [`Total: ${input.patients.length} paciente(s)`], {
    title: input.metricLabel,
  });

  let y = writer.cursorY + 4;

  const columns = hasValues
    ? [
        { header: "Paciente", width: 48 },
        { header: "Telefone", width: 36 },
        { header: "Informação", width: 70 },
        { header: "Valor", width: 28 },
      ]
    : [
        { header: "Paciente", width: 52 },
        { header: "Telefone", width: 40 },
        { header: "Informação", width: 90 },
      ];

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX, y - 4, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    let x = marginX + 1;
    for (const column of columns) {
      doc.text(column.header, x, y);
      x += column.width;
    }
    y += 8;
  };

  drawHeader();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const patient of input.patients) {
    if (y > 280) {
      doc.addPage();
      y = PATIENT_PDF_PAGE_MARGIN_TOP;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    const values = [
      patient.name,
      formatPhone(patient.phone) || patient.phone || "—",
      patient.detail ??
        ([patient.email, patient.cpf]
          .filter((value): value is string => Boolean(value))
          .join(" · ") ||
          "—"),
      ...(hasValues
        ? [formatDashboardCurrencyFromCents(patient.valueCents ?? 0)]
        : []),
    ];
    let x = marginX + 1;
    doc.setTextColor(40, 40, 40);
    values.forEach((value, index) => {
      const column = columns[index];
      if (!column) return;
      const maxLength = index === 2 ? 42 : 30;
      const text =
        value.length > maxLength
          ? `${value.slice(0, maxLength - 3)}...`
          : value;
      doc.text(text, x, y);
      x += column.width;
    });

    y += 2;
    doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 7;
  }

  drawPatientPdfFooter(writer, generatedAt);

  return doc.output("blob");
}
