import type { jsPDF } from 'jspdf';
import { CLINIC_THEME } from '@/features/clinic/lib/theme';
import { formatCep } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import type { ClinicSettingsFormData } from '@/features/clinic/modules/settings/types/clinic-settings';
import { formatPatientPhone } from './format-patient-contact';
import { formatPatientBirthDate } from './format-patient-profile';
import {
  PATIENT_PDF_ICON_PHONE_PATH,
  PATIENT_PDF_ICON_PIN_PATH,
  PATIENT_PDF_ICON_STROKE_WIDTH,
  PATIENT_PDF_ICON_VIEWBOX,
  type PatientPdfIconPathOp,
} from './patient-pdf-header-icon-paths';

export const PATIENT_PDF_PAGE_MARGIN_X = 14;
export const PATIENT_PDF_PAGE_MARGIN_TOP = 14;
export const PATIENT_PDF_PAGE_MARGIN_BOTTOM = 18;
export const PATIENT_PDF_LINE_HEIGHT = 5;

export const PATIENT_PDF_BORDER_COLOR: [number, number, number] = [210, 214, 220];
export const PATIENT_PDF_HEADER_FILL: [number, number, number] = [248, 250, 252];
export const PATIENT_PDF_MUTED_TEXT: [number, number, number] = [82, 88, 96];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixRgbWithWhite(
  rgb: [number, number, number],
  whiteAmount: number,
): [number, number, number] {
  return [
    Math.round(rgb[0] * (1 - whiteAmount) + 255 * whiteAmount),
    Math.round(rgb[1] * (1 - whiteAmount) + 255 * whiteAmount),
    Math.round(rgb[2] * (1 - whiteAmount) + 255 * whiteAmount),
  ];
}

export const PATIENT_PDF_BRAND_COLOR = hexToRgb(CLINIC_THEME.primaryColor);
const PATIENT_PDF_BRAND_SOFT_FILL = mixRgbWithWhite(PATIENT_PDF_BRAND_COLOR, 0.86);

export const PATIENT_PDF_HEADER_LOGO_HEIGHT_MM = 14;
const HEADER_LOGO_GAP = 4;
const HEADER_DETAIL_LINE_HEIGHT = 5;
const HEADER_DETAIL_FONT_SIZE = 8.5;
const HEADER_ADDRESS_MIN_FONT_SIZE = 6.5;
const HEADER_ISSUED_AT_FONT_SIZE = 8;
const HEADER_CORNER_DATE_OFFSET_FROM_BOTTOM = 8;
const FOOTER_LINE_OFFSET_FROM_BOTTOM = 11;
const FOOTER_TEXT_OFFSET_FROM_BOTTOM = 7;
const HEADER_CLINIC_NAME_FONT_SIZE = 13;
const HEADER_TITLE_FONT_SIZE = 11;
const HEADER_SECONDARY_LINE_GAP = 5;
const HEADER_ISSUED_EXTRA_GAP = 2;
const HEADER_CLINIC_TEXT: [number, number, number] = [0, 0, 0];
const HEADER_SEPARATOR_GAP_BEFORE = 3.5;
const HEADER_CONTACT_GAP_AFTER_RULE = 5;
const HEADER_GAP_AFTER_CONTACT = 18;
const HEADER_SEAL_PADDING_X = 3;
const HEADER_SEAL_HEIGHT = 7.4;
const HEADER_ICON_SIZE = 2.6;
const HEADER_ICON_GAP = 1.6;
const HEADER_IDENTITY_GAP = 8;
const PDF_LOGO_MAX_PIXELS = 384;
const PDF_LOGO_JPEG_QUALITY = 0.82;

export type PatientPdfClinicInfo = {
  clinicName: string;
  communicationsName?: string;
  cnpj?: string;
  responsible?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  addressLine?: string;
  logoUrl?: string;
};

export type PatientPdfImageAsset = {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
  width: number;
  height: number;
};

export type PatientPdfStatusBadge = {
  label: string;
  fill: [number, number, number];
  text: [number, number, number];
  border: [number, number, number];
};

export type PatientPdfWriter = {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  cursorY: number;
  ensureSpace: (requiredHeight: number) => void;
  cornerDateLabel?: string;
  footerLabel?: string;
};

export function splitPatientPdfText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function slugifyPatientPdfFileNamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function formatPatientPdfDateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatPatientPdfDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return value;
}

function trimAddressPart(value: string | undefined): string {
  return value?.trim() ?? '';
}

function formatClinicPdfCityState(city: string, state: string): string {
  const cityPart = trimAddressPart(city);
  const statePart = trimAddressPart(state).toUpperCase();

  if (cityPart && statePart) {
    return `${cityPart} /${statePart}`;
  }

  return cityPart || statePart;
}

export function formatClinicPdfAddressLine(profile: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}): string | undefined {
  const cepDigits = trimAddressPart(profile.cep).replace(/\D/g, '');
  const parts = [
    trimAddressPart(profile.street),
    trimAddressPart(profile.number),
    trimAddressPart(profile.complement),
    trimAddressPart(profile.neighborhood),
    formatClinicPdfCityState(profile.city, profile.state),
    cepDigits ? formatCep(cepDigits) : '',
  ].filter((part) => part.length > 0);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function mapClinicSettingsToPdfClinic(
  profile: ClinicSettingsFormData,
): PatientPdfClinicInfo {
  const clinicName = profile.clinicName.trim() || profile.communicationsName.trim() || 'Clínica';

  return {
    clinicName,
    communicationsName:
      profile.communicationsName.trim() &&
      profile.communicationsName.trim() !== clinicName
        ? profile.communicationsName.trim()
        : undefined,
    cnpj: profile.cnpj.trim() || undefined,
    responsible: profile.responsible.trim() || undefined,
    email: profile.email.trim() || undefined,
    phone: profile.phone.trim() || undefined,
    mobile: profile.mobile.trim() || undefined,
    addressLine: formatClinicPdfAddressLine(profile),
    logoUrl: profile.logoUrl,
  };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('failed to load image'));
    image.src = src;
  });
}

export function scaleLogoPixelSize(
  width: number,
  height: number,
  maxPixels = PDF_LOGO_MAX_PIXELS,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: maxPixels, height: maxPixels };
  }

  const longest = Math.max(width, height);
  if (longest <= maxPixels) {
    return { width, height };
  }

  const scale = maxPixels / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function rasterizeLogoForPdf(blob: Blob): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImageElement(objectUrl);
    const size = scaleLogoPixelSize(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('canvas context unavailable');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', PDF_LOGO_JPEG_QUALITY),
      width: size.width,
      height: size.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadClinicLogoForPdf(
  logoUrl?: string,
): Promise<PatientPdfImageAsset | null> {
  if (!logoUrl?.trim()) {
    return null;
  }

  try {
    const response = await fetch(logoUrl, { credentials: 'include' });
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const rasterized = await rasterizeLogoForPdf(blob);
    return {
      dataUrl: rasterized.dataUrl,
      format: 'JPEG',
      width: rasterized.width,
      height: rasterized.height,
    };
  } catch {
    return null;
  }
}

export function fitHeaderLogoDimensions(
  naturalWidth: number,
  naturalHeight: number,
  heightMm = PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: heightMm, height: heightMm };
  }

  return {
    width: heightMm * (naturalWidth / naturalHeight),
    height: heightMm,
  };
}

function toPdfCornerDateLabel(label: string): string {
  const commaIndex = label.indexOf(',');
  if (commaIndex === -1) {
    return label;
  }

  return label.slice(0, commaIndex).trim();
}

function stampPatientPdfGeneratedFooter(writer: PatientPdfWriter): void {
  if (!writer.footerLabel) {
    return;
  }

  const { doc, pageHeight, contentWidth } = writer;
  const lineY = pageHeight - FOOTER_LINE_OFFSET_FROM_BOTTOM;
  const textY = pageHeight - FOOTER_TEXT_OFFSET_FROM_BOTTOM;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.line(
    PATIENT_PDF_PAGE_MARGIN_X,
    lineY,
    PATIENT_PDF_PAGE_MARGIN_X + contentWidth,
    lineY,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text(writer.footerLabel, PATIENT_PDF_PAGE_MARGIN_X, textY);
}

function stampPatientPdfCornerDate(writer: PatientPdfWriter): void {
  if (!writer.cornerDateLabel) {
    return;
  }

  const { doc, pageWidth, pageHeight } = writer;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(HEADER_ISSUED_AT_FONT_SIZE);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text(
    writer.cornerDateLabel,
    pageWidth - PATIENT_PDF_PAGE_MARGIN_X,
    pageHeight - HEADER_CORNER_DATE_OFFSET_FROM_BOTTOM,
    { align: 'right' },
  );
}

export function createPatientPdfWriter(doc: jsPDF): PatientPdfWriter {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PATIENT_PDF_PAGE_MARGIN_X * 2;

  const writer: PatientPdfWriter = {
    doc,
    pageWidth,
    pageHeight,
    contentWidth,
    cursorY: PATIENT_PDF_PAGE_MARGIN_TOP,
    ensureSpace(requiredHeight: number) {
      if (writer.cursorY + requiredHeight <= pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM) {
        return;
      }

      doc.addPage();
      writer.cursorY = PATIENT_PDF_PAGE_MARGIN_TOP;
      stampPatientPdfCornerDate(writer);
    },
  };

  return writer;
}

function formatClinicHeaderPhones(clinic: PatientPdfClinicInfo): string | undefined {
  const phoneParts = [
    clinic.phone ? formatPhone(clinic.phone) : '',
    clinic.mobile ? formatPhone(clinic.mobile) : '',
  ].filter(Boolean);

  return phoneParts.length > 0 ? phoneParts.join(' / ') : undefined;
}

type HeaderIconKind = 'pin' | 'phone' | 'mail';

function scaleHeaderIconPath(
  ops: readonly PatientPdfIconPathOp[],
  originX: number,
  originY: number,
  size: number,
): PatientPdfIconPathOp[] {
  const scale = size / PATIENT_PDF_ICON_VIEWBOX;
  return ops.map((segment) => {
    if (segment.op === 'h') {
      return { op: 'h', c: [] };
    }

    return {
      op: segment.op,
      c: segment.c.map((value, index) =>
        index % 2 === 0 ? originX + value * scale : originY + value * scale,
      ),
    };
  });
}

function drawHeaderIcon(
  doc: jsPDF,
  kind: HeaderIconKind,
  x: number,
  baselineY: number,
): void {
  const size = HEADER_ICON_SIZE;
  const top = baselineY - size * 0.8;
  doc.setDrawColor(...PATIENT_PDF_MUTED_TEXT);
  doc.setLineWidth((PATIENT_PDF_ICON_STROKE_WIDTH / PATIENT_PDF_ICON_VIEWBOX) * size);
  doc.setLineCap('round');
  doc.setLineJoin('round');

  if (kind === 'pin') {
    doc.path(scaleHeaderIconPath(PATIENT_PDF_ICON_PIN_PATH, x, top, size));
    doc.stroke();
    const scale = size / PATIENT_PDF_ICON_VIEWBOX;
    doc.circle(x + 12 * scale, top + 10 * scale, 3 * scale, 'S');
  } else if (kind === 'phone') {
    doc.path(scaleHeaderIconPath(PATIENT_PDF_ICON_PHONE_PATH, x, top, size));
    doc.stroke();
  } else {
    doc.setLineWidth(0.32);
    doc.setLineCap('butt');
    doc.setLineJoin('miter');
    doc.rect(x, top + 0.45, size, size - 0.9, 'S');
    doc.line(x, top + 0.45, x + size / 2, top + size / 2);
    doc.line(x + size, top + 0.45, x + size / 2, top + size / 2);
  }

  doc.setLineCap('butt');
  doc.setLineJoin('miter');
  doc.setLineWidth(0.2);
}

function drawStatusBadge(
  doc: jsPDF,
  rightX: number,
  centerY: number,
  badge: PatientPdfStatusBadge,
): number {
  const badgePaddingX = 3.5;
  const badgeHeight = 6.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const textWidth = doc.getTextWidth(badge.label);
  const badgeWidth = textWidth + badgePaddingX * 2;
  const badgeX = rightX - badgeWidth;
  const badgeY = centerY - badgeHeight / 2;

  doc.setFillColor(...badge.fill);
  doc.setDrawColor(...badge.border);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');

  doc.setTextColor(...badge.text);
  doc.text(badge.label, rightX - badgeWidth / 2, centerY + 1.1, { align: 'center' });

  return badgeWidth;
}

type DrawPatientPdfClinicHeaderInput = {
  writer: PatientPdfWriter;
  clinic: PatientPdfClinicInfo;
  documentTitle: string;
  issuedAtLabel: string;
  logo: PatientPdfImageAsset | null;
  stampCornerDate?: boolean;
};

function fitSingleLineFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number,
  minFontSize: number,
): number {
  let size = fontSize;
  doc.setFontSize(size);

  while (size > minFontSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }

  return size;
}

export function drawPatientPdfClinicHeader({
  writer,
  clinic,
  documentTitle,
  issuedAtLabel,
  logo,
  stampCornerDate = true,
}: DrawPatientPdfClinicHeaderInput): void {
  const { doc, pageWidth, contentWidth } = writer;
  const leftX = PATIENT_PDF_PAGE_MARGIN_X;
  const rightX = pageWidth - PATIENT_PDF_PAGE_MARGIN_X;
  const fittedLogo = logo
    ? fitHeaderLogoDimensions(logo.width, logo.height)
    : null;
  const logoOffset = fittedLogo ? fittedLogo.width + HEADER_LOGO_GAP : 0;
  const nameX = leftX + logoOffset;
  const cnpjLabel = clinic.cnpj ? `CNPJ: ${formatCnpj(clinic.cnpj)}` : undefined;
  const phoneLabel = formatClinicHeaderPhones(clinic);

  writer.cornerDateLabel = stampCornerDate
    ? toPdfCornerDateLabel(issuedAtLabel)
    : undefined;

  const identityTop = writer.cursorY;
  const nameBaseline = identityTop + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(HEADER_TITLE_FONT_SIZE);
  const titleFontSize = fitSingleLineFontSize(
    doc,
    documentTitle,
    contentWidth * 0.46,
    HEADER_TITLE_FONT_SIZE,
    8,
  );
  const titleWidth = doc.getTextWidth(documentTitle);
  const sealWidth = titleWidth + HEADER_SEAL_PADDING_X * 2;
  const sealX = rightX - sealWidth;
  const sealY = nameBaseline - 5.15;
  const nameMaxWidth = Math.max(rightX - sealWidth - HEADER_IDENTITY_GAP - nameX, 36);

  if (logo && fittedLogo) {
    doc.addImage(
      logo.dataUrl,
      logo.format,
      leftX,
      identityTop,
      fittedLogo.width,
      fittedLogo.height,
    );
  }

  doc.setFillColor(...PATIENT_PDF_BRAND_SOFT_FILL);
  doc.setDrawColor(...PATIENT_PDF_BRAND_COLOR);
  doc.setLineWidth(0.25);
  doc.roundedRect(sealX, sealY, sealWidth, HEADER_SEAL_HEIGHT, 1.6, 1.6, 'FD');
  doc.setLineWidth(0.2);

  doc.setTextColor(...PATIENT_PDF_BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFontSize);
  doc.text(documentTitle, rightX - HEADER_SEAL_PADDING_X, nameBaseline, {
    align: 'right',
  });

  doc.setTextColor(...HEADER_CLINIC_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(HEADER_CLINIC_NAME_FONT_SIZE);
  const nameLines = splitPatientPdfText(doc, clinic.clinicName, nameMaxWidth);
  let nameY = nameBaseline;
  for (const [index, line] of nameLines.entries()) {
    doc.text(line, nameX, nameY);
    if (index < nameLines.length - 1) {
      nameY += 5.2;
    }
  }

  const secondaryY = nameY + HEADER_SECONDARY_LINE_GAP;
  const issuedY = secondaryY + HEADER_ISSUED_EXTRA_GAP;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(HEADER_DETAIL_FONT_SIZE);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  if (cnpjLabel) {
    doc.text(cnpjLabel, nameX, secondaryY);
  }

  doc.setFontSize(HEADER_ISSUED_AT_FONT_SIZE);
  doc.text(issuedAtLabel, rightX, issuedY, { align: 'right' });

  const identityBottom = Math.max(
    identityTop + (fittedLogo?.height ?? 0),
    nameY,
    secondaryY,
    issuedY,
    sealY + HEADER_SEAL_HEIGHT,
  );
  const ruleY = identityBottom + HEADER_SEPARATOR_GAP_BEFORE;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.setLineWidth(0.25);
  doc.line(leftX, ruleY, leftX + contentWidth, ruleY);
  doc.setLineWidth(0.2);

  let contactY = ruleY + HEADER_CONTACT_GAP_AFTER_RULE;
  const textX = leftX + HEADER_ICON_SIZE + HEADER_ICON_GAP;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(HEADER_DETAIL_FONT_SIZE);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);

  if (phoneLabel) {
    const phoneWidth = doc.getTextWidth(phoneLabel);
    drawHeaderIcon(
      doc,
      'phone',
      rightX - phoneWidth - HEADER_ICON_GAP - HEADER_ICON_SIZE,
      contactY,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(HEADER_DETAIL_FONT_SIZE);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(phoneLabel, rightX, contactY, { align: 'right' });
  }

  if (clinic.addressLine) {
    const phoneWidth = phoneLabel ? doc.getTextWidth(phoneLabel) : 0;
    const phoneBlockWidth = phoneLabel
      ? phoneWidth + HEADER_ICON_SIZE + HEADER_ICON_GAP + 6
      : 0;
    const addressMaxWidth = Math.max(
      contentWidth - phoneBlockWidth - (textX - leftX),
      40,
    );
    drawHeaderIcon(doc, 'pin', leftX, contactY);
    const addressFontSize = fitSingleLineFontSize(
      doc,
      clinic.addressLine,
      addressMaxWidth,
      HEADER_DETAIL_FONT_SIZE,
      HEADER_ADDRESS_MIN_FONT_SIZE,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(addressFontSize);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(clinic.addressLine, textX, contactY);
    contactY += HEADER_DETAIL_LINE_HEIGHT;
  } else if (phoneLabel) {
    contactY += HEADER_DETAIL_LINE_HEIGHT;
  }

  if (clinic.email) {
    drawHeaderIcon(doc, 'mail', leftX, contactY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(HEADER_DETAIL_FONT_SIZE);
    doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
    doc.text(clinic.email, textX, contactY);
    contactY += HEADER_DETAIL_LINE_HEIGHT;
  }

  writer.cursorY = contactY + HEADER_GAP_AFTER_CONTACT;
}

export function drawPatientPdfMetaRows(
  writer: PatientPdfWriter,
  rows: string[],
  options?: { title?: string; trailingBadge?: PatientPdfStatusBadge },
): void {
  const { doc, pageWidth, contentWidth } = writer;
  const rightX = pageWidth - PATIENT_PDF_PAGE_MARGIN_X;
  const trailingBadge = options?.trailingBadge;

  if (options?.title) {
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(options.title, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += 7;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  rows.forEach((row, index) => {
    if (index === 0 && trailingBadge) {
      const badgeWidth = drawStatusBadge(doc, rightX, writer.cursorY, trailingBadge);
      const maxWidth = Math.max(contentWidth - badgeWidth - 4, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);

      for (const line of splitPatientPdfText(doc, row, maxWidth)) {
        doc.text(line, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
        writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
      }
      return;
    }

    doc.text(row, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
    writer.cursorY += PATIENT_PDF_LINE_HEIGHT;
  });

  writer.cursorY += 4;
}

export function drawPatientPdfFooter(writer: PatientPdfWriter, generatedAt: Date): void {
  const { doc } = writer;
  writer.cornerDateLabel = undefined;
  writer.footerLabel = `Documento gerado em ${formatPatientPdfDateTime(generatedAt)}`;

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    stampPatientPdfGeneratedFooter(writer);
  }
}

export const PATIENT_PDF_SECTION_HEADING_FONT_SIZE = 12.5;
export const PATIENT_PDF_DETAIL_FONT_SIZE = 10;
export const PATIENT_PDF_DETAIL_LINE_HEIGHT = 5.5;
/** Folga após o bloco de uma seção (ex.: Dados do Paciente) antes do próximo título. */
export const PATIENT_PDF_GAP_BETWEEN_SECTIONS = 8;

export type PatientPdfPatientDataInput = {
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
};

export function drawPatientPdfHorizontalRule(writer: PatientPdfWriter): void {
  const { doc, contentWidth } = writer;

  doc.setDrawColor(...PATIENT_PDF_BORDER_COLOR);
  doc.line(
    PATIENT_PDF_PAGE_MARGIN_X,
    writer.cursorY,
    PATIENT_PDF_PAGE_MARGIN_X + contentWidth,
    writer.cursorY,
  );
  writer.cursorY += 4;
}

export function drawPatientPdfLabelValueLine(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
  doc.setTextColor(31, 41, 55);
  const labelText = `${label}: `;
  doc.text(labelText, x, y);
  const labelWidth = doc.getTextWidth(labelText);
  doc.setFont('helvetica', 'normal');
  doc.text(value, x + labelWidth, y);
}

export function drawPatientPdfWrappableLabelValueLine(
  writer: PatientPdfWriter,
  label: string,
  value: string,
): void {
  const { doc, contentWidth } = writer;
  const x = PATIENT_PDF_PAGE_MARGIN_X;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PATIENT_PDF_DETAIL_FONT_SIZE);
  doc.setTextColor(31, 41, 55);

  const labelText = `${label}: `;
  const labelWidth = doc.getTextWidth(labelText);
  const valueMaxWidth = contentWidth - labelWidth;
  const valueLines = splitPatientPdfText(doc, value, valueMaxWidth);
  const lineCount = Math.max(valueLines.length, 1);

  writer.ensureSpace(lineCount * PATIENT_PDF_DETAIL_LINE_HEIGHT + 1);

  for (let index = 0; index < lineCount; index += 1) {
    const lineY = writer.cursorY;

    if (index === 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(labelText, x, lineY);
      doc.setFont('helvetica', 'normal');
      doc.text(valueLines[index] ?? '', x + labelWidth, lineY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(valueLines[index] ?? '', x + labelWidth, lineY);
    }

    writer.cursorY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }
}

export function drawPatientPdfSectionHeading(
  writer: PatientPdfWriter,
  title: string,
  options?: { gapAfter?: number },
): void {
  const { doc } = writer;
  const gapAfter = options?.gapAfter ?? 6;

  writer.ensureSpace(8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PATIENT_PDF_SECTION_HEADING_FONT_SIZE);
  doc.setTextColor(17, 24, 39);
  doc.text(title, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY);
  writer.cursorY += gapAfter;
}

export function drawPatientPdfLabelValueSection(
  writer: PatientPdfWriter,
  title: string,
  fields: Array<[string, string]>,
): void {
  const { doc } = writer;

  writer.ensureSpace(6 + fields.length * PATIENT_PDF_DETAIL_LINE_HEIGHT + 10);
  drawPatientPdfSectionHeading(writer, title, { gapAfter: 2 });
  drawPatientPdfHorizontalRule(writer);

  for (const [label, value] of fields) {
    drawPatientPdfLabelValueLine(doc, PATIENT_PDF_PAGE_MARGIN_X, writer.cursorY, label, value);
    writer.cursorY += PATIENT_PDF_DETAIL_LINE_HEIGHT;
  }

  writer.cursorY += PATIENT_PDF_GAP_BETWEEN_SECTIONS;
}

export function drawPatientPdfPatientDataSection(
  writer: PatientPdfWriter,
  input: PatientPdfPatientDataInput,
): void {
  const phone = input.patientPhone?.trim() ? formatPatientPhone(input.patientPhone) : '—';
  const birthDate = input.patientBirthDate?.trim()
    ? formatPatientBirthDate(input.patientBirthDate)
    : '—';

  drawPatientPdfLabelValueSection(writer, 'Dados do Paciente', [
    ['Nome', input.patientName],
    ['Telefone', phone],
    ['Nascimento', birthDate],
  ]);
}

export function drawPatientPdfSignatureSection(writer: PatientPdfWriter, patientName: string): void {
  const { doc, contentWidth } = writer;
  const signatureWidth = 92;
  const lineY = writer.cursorY + 9;
  const lineStartX = PATIENT_PDF_PAGE_MARGIN_X + (contentWidth - signatureWidth) / 2;
  const lineEndX = lineStartX + signatureWidth;
  const centerX = lineStartX + signatureWidth / 2;

  writer.ensureSpace(24);

  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.6);
  doc.line(lineStartX, lineY, lineEndX, lineY);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);
  doc.text(patientName, centerX, lineY + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PATIENT_PDF_MUTED_TEXT);
  doc.text('Assinatura Paciente / Responsável', centerX, lineY + 10, { align: 'center' });

  writer.cursorY = lineY + 13;
}
