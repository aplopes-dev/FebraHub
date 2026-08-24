import { jsPDF } from 'jspdf';
import { describe, expect, it, vi } from 'vitest';
import type { ClinicSettingsFormData } from '../../settings/types/clinic-settings';
import {
  createPatientPdfWriter,
  drawPatientPdfClinicHeader,
  drawPatientPdfFooter,
  drawPatientPdfMetaRows,
  mapClinicSettingsToPdfClinic,
  PATIENT_PDF_BORDER_COLOR,
  PATIENT_PDF_BRAND_COLOR,
  PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
  PATIENT_PDF_MUTED_TEXT,
  PATIENT_PDF_PAGE_MARGIN_BOTTOM,
  PATIENT_PDF_PAGE_MARGIN_X,
  fitHeaderLogoDimensions,
  scaleLogoPixelSize,
  type PatientPdfClinicInfo,
} from './patient-pdf-shared';

type DrawnText = {
  text: string;
  x: number;
  y: number;
  align?: string;
  fontSize: number;
  color: [number, number, number];
};

type DrawnRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: [number, number, number];
};

type DrawnImage = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type DrawnLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number];
};

type DrawnPathOp = {
  op: string;
  c: number[];
};

type DrawnPath = {
  ops: DrawnPathOp[];
};

type DrawnCircle = {
  x: number;
  y: number;
  r: number;
};

function clinicInfo(): PatientPdfClinicInfo {
  return {
    clinicName: 'Clínica Sorriso',
    communicationsName: 'Sorriso Odontologia',
    cnpj: '12345678000199',
    responsible: 'Dr. Carlos',
    email: 'contato@sorriso.com',
    phone: '7336211234',
    mobile: '73999887766',
    addressLine: 'Rua das Flores, 100, Centro, Ilhéus /BA, 45650-000',
  };
}

function clinicSettings(
  overrides: Partial<ClinicSettingsFormData> = {},
): ClinicSettingsFormData {
  return {
    clinicName: 'Clínica Sorriso',
    communicationsName: '',
    cnpj: '',
    responsible: '',
    openingTime: '08:00',
    closingTime: '18:00',
    email: '',
    phone: '',
    mobile: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    ...overrides,
  };
}

function instrumentDoc() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const texts: DrawnText[] = [];
  const rects: DrawnRect[] = [];
  const lines: DrawnLine[] = [];
  const images: DrawnImage[] = [];
  const paths: DrawnPath[] = [];
  const circles: DrawnCircle[] = [];
  let fontSize = 10;
  let textColor: [number, number, number] = [0, 0, 0];
  let drawColor: [number, number, number] = [0, 0, 0];
  let fillColor: [number, number, number] = [0, 0, 0];
  const originalSetFontSize = doc.setFontSize.bind(doc);
  const originalSetTextColor = doc.setTextColor.bind(doc);
  const originalSetDrawColor = doc.setDrawColor.bind(doc);
  const originalSetFillColor = doc.setFillColor.bind(doc);

  vi.spyOn(doc, 'setFontSize').mockImplementation((size: number) => {
    fontSize = size;
    return originalSetFontSize(size);
  });

  vi.spyOn(doc, 'setTextColor').mockImplementation((...args: number[]) => {
    if (args.length >= 3) {
      textColor = [Number(args[0]), Number(args[1]), Number(args[2])];
    }
    return originalSetTextColor(...args);
  });

  vi.spyOn(doc, 'setDrawColor').mockImplementation((...args: number[]) => {
    if (args.length >= 3) {
      drawColor = [Number(args[0]), Number(args[1]), Number(args[2])];
    }
    return originalSetDrawColor(...args);
  });

  vi.spyOn(doc, 'setFillColor').mockImplementation((...args: number[]) => {
    if (args.length >= 3) {
      fillColor = [Number(args[0]), Number(args[1]), Number(args[2])];
    }
    return originalSetFillColor(...args);
  });

  vi.spyOn(doc, 'text').mockImplementation((text, x, y, options) => {
    const value = Array.isArray(text) ? text.join(' ') : String(text);
    texts.push({
      text: value,
      x: Number(x),
      y: Number(y),
      align:
        options && typeof options === 'object' && 'align' in options
          ? String(options.align)
          : undefined,
      fontSize,
      color: textColor,
    });
    return doc;
  });

  vi.spyOn(doc, 'roundedRect').mockImplementation((x, y, w, h) => {
    rects.push({
      x: Number(x),
      y: Number(y),
      w: Number(w),
      h: Number(h),
      fill: fillColor,
    });
    return doc;
  });

  vi.spyOn(doc, 'line').mockImplementation((x1, y1, x2, y2) => {
    lines.push({
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2),
      color: drawColor,
    });
    return doc;
  });

  vi.spyOn(doc, 'addImage').mockImplementation((...args: unknown[]) => {
    images.push({
      x: Number(args[2]),
      y: Number(args[3]),
      w: Number(args[4]),
      h: Number(args[5]),
    });
    return doc;
  });

  vi.spyOn(doc, 'path').mockImplementation((ops) => {
    paths.push({
      ops: (ops ?? []).map((segment: { op?: string; c?: number[] }) => ({
        op: String(segment.op ?? ''),
        c: Array.isArray(segment.c) ? segment.c.map(Number) : [],
      })),
    });
    return doc;
  });

  vi.spyOn(doc, 'circle').mockImplementation((x, y, r) => {
    circles.push({ x: Number(x), y: Number(y), r: Number(r) });
    return doc;
  });

  return {
    doc,
    texts,
    rects,
    lines,
    images,
    paths,
    circles,
    pageWidth: doc.internal.pageSize.getWidth(),
  };
}

function drawHeader(
  extras?: Partial<Parameters<typeof drawPatientPdfClinicHeader>[0]>,
) {
  const instrumented = instrumentDoc();
  const writer = createPatientPdfWriter(instrumented.doc);

  drawPatientPdfClinicHeader({
    writer,
    clinic: clinicInfo(),
    documentTitle: 'Ficha de anamnese',
    issuedAtLabel: '18 de agosto de 2026',
    logo: null,
    ...extras,
  });

  return { ...instrumented, writer };
}

function findText(texts: DrawnText[], matcher: string | RegExp): DrawnText {
  const found = texts.find((entry) =>
    typeof matcher === 'string' ? entry.text === matcher : matcher.test(entry.text),
  );
  if (!found) {
    throw new Error(`Text not drawn: ${matcher}`);
  }
  return found;
}

describe('drawPatientPdfClinicHeader', () => {
  it('does not draw a full-width header card', () => {
    const { rects, pageWidth } = drawHeader();
    const contentWidth = pageWidth - PATIENT_PDF_PAGE_MARGIN_X * 2;

    expect(rects.some((rect) => Math.abs(rect.w - contentWidth) < 1)).toBe(false);
  });

  it('puts clinic name on the left and document type on the right of the same row', () => {
    const { texts, pageWidth } = drawHeader();
    const midX = pageWidth / 2;
    const clinicName = findText(texts, 'Clínica Sorriso');
    const title = findText(texts, 'Ficha de anamnese');

    expect(clinicName.x).toBeLessThan(midX);
    expect(clinicName.align).not.toBe('right');
    expect(title.align).toBe('right');
    expect(title.x).toBeGreaterThan(midX);
    expect(Math.abs(title.y - clinicName.y)).toBeLessThan(3);
    expect(clinicName.fontSize).toBeGreaterThanOrEqual(12);
    expect(title.fontSize).toBeGreaterThanOrEqual(10);
  });

  it('draws a compact brand-colored seal around the document type', () => {
    const { texts, rects, pageWidth } = drawHeader();
    const title = findText(texts, 'Ficha de anamnese');
    const seal = rects.find((rect) => rect.x > pageWidth / 2 && rect.w < 90);

    expect(title.color).toEqual(PATIENT_PDF_BRAND_COLOR);
    expect(seal).toBeDefined();
    expect(seal?.h).toBeLessThanOrEqual(10);
    expect(seal?.fill?.[0]).toBeGreaterThan(200);
    expect(seal?.fill?.[2]).toBeGreaterThan(seal?.fill?.[0] ?? 0);
  });

  it('places CNPJ under the clinic name and the issued date under the document type', () => {
    const { texts, pageWidth } = drawHeader();
    const midX = pageWidth / 2;
    const clinicName = findText(texts, 'Clínica Sorriso');
    const title = findText(texts, 'Ficha de anamnese');
    const cnpj = findText(texts, 'CNPJ: 12.345.678/0001-99');
    const issued = findText(texts, '18 de agosto de 2026');

    expect(cnpj.x).toBeLessThan(midX);
    expect(cnpj.y).toBeGreaterThan(clinicName.y);
    expect(issued.align).toBe('right');
    expect(issued.x).toBeGreaterThan(midX);
    expect(issued.y).toBeGreaterThan(title.y);
    expect(issued.y - title.y).toBeGreaterThan(6);
    expect(issued.y - cnpj.y).toBeGreaterThanOrEqual(1.5);
    expect(issued.y - cnpj.y).toBeLessThan(4);
    expect(cnpj.fontSize).toBeLessThan(clinicName.fontSize);
    expect(issued.fontSize).toBeLessThan(title.fontSize);
    expect(texts.some((entry) => entry.text.includes('Emissão:'))).toBe(false);
  });

  it('keeps contact below a thin divider, with address/email on the left and phone on the right', () => {
    const { texts, lines, pageWidth } = drawHeader();
    const midX = pageWidth / 2;
    const contentWidth = pageWidth - PATIENT_PDF_PAGE_MARGIN_X * 2;
    const cnpj = findText(texts, 'CNPJ: 12.345.678/0001-99');
    const title = findText(texts, 'Ficha de anamnese');
    const address = findText(texts, /Ilhéus/);
    const email = findText(texts, 'contato@sorriso.com');
    const phones = findText(texts, '(73) 3621-1234 / (73) 99988-7766');
    const separator = lines.find(
      (line) => Math.abs(line.x2 - line.x1 - contentWidth) < 1,
    );

    expect(separator).toBeDefined();
    expect(separator?.y1).toBeGreaterThan(cnpj.y);
    expect(separator?.y1).toBeGreaterThan(title.y);
    expect(separator?.color).toEqual(PATIENT_PDF_BORDER_COLOR);
    expect(address.y).toBeGreaterThan(separator?.y1 ?? 0);
    expect(email.y).toBeGreaterThan(address.y);
    expect(Math.abs(phones.y - address.y)).toBeLessThan(3);
    expect(address.x).toBeGreaterThan(PATIENT_PDF_PAGE_MARGIN_X);
    expect(address.align).not.toBe('right');
    expect(email.align).not.toBe('right');
    expect(phones.align).toBe('right');
    expect(phones.x).toBeGreaterThan(midX);
    expect(texts.some((entry) => entry.text.includes('Sorriso Odontologia'))).toBe(false);
    expect(texts.some((entry) => entry.text.includes('Dr. Carlos'))).toBe(false);
    expect(address.x - PATIENT_PDF_PAGE_MARGIN_X).toBeLessThan(5);
  });

  it('leaves space after clinic contact so document content does not sit on the email', () => {
    const { texts, writer } = drawHeader();
    const email = findText(texts, 'contato@sorriso.com');

    expect(writer.cursorY - email.y).toBeGreaterThanOrEqual(22);
  });

  it('draws a map pin for the address and a handset for the phone, not stick or box strokes', () => {
    const { paths, circles, lines, pageWidth } = drawHeader();
    const midX = pageWidth / 2;
    const pin = paths.find((path) => (path.ops[0]?.c[0] ?? 0) < midX);
    const phone = paths.find((path) => (path.ops[0]?.c[0] ?? 0) > midX);

    expect(pin?.ops.some((segment) => segment.op === 'c')).toBe(true);
    expect(phone?.ops.some((segment) => segment.op === 'h')).toBe(true);
    expect(circles.some((circle) => circle.x < midX && circle.r < 0.7)).toBe(true);
    expect(
      lines.some(
        (line) =>
          line.x1 < PATIENT_PDF_PAGE_MARGIN_X + 8 &&
          Math.abs(line.x1 - line.x2) < 0.05 &&
          Math.abs(line.y2 - line.y1) > 1.2,
      ),
    ).toBe(false);
  });

  it('keeps supporting contact in muted color so it does not compete with name and document type', () => {
    const { texts } = drawHeader();
    const clinicName = findText(texts, 'Clínica Sorriso');
    const title = findText(texts, 'Ficha de anamnese');

    expect(clinicName.color).toEqual([0, 0, 0]);
    expect(title.color).toEqual(PATIENT_PDF_BRAND_COLOR);
    for (const entry of [
      findText(texts, 'CNPJ: 12.345.678/0001-99'),
      findText(texts, '18 de agosto de 2026'),
      findText(texts, /Ilhéus/),
      findText(texts, 'contato@sorriso.com'),
      findText(texts, '(73) 3621-1234 / (73) 99988-7766'),
    ]) {
      expect(entry.color).toEqual(PATIENT_PDF_MUTED_TEXT);
    }
  });

  it('keeps the clinic address on a single line', () => {
    const addressLine =
      'Rua Victor Rosemberg, 43, Vila Lenzi, Jaraguá do Sul /SC, 89252-400';
    const { texts } = drawHeader({
      clinic: {
        ...clinicInfo(),
        addressLine,
      },
    });

    expect(findText(texts, addressLine).align).not.toBe('right');
    expect(texts.filter((entry) => entry.text.includes('89252-400'))).toHaveLength(1);
  });

  it('stamps a date-only label on extra pages, not on the first page corner', () => {
    const { texts, pageWidth, doc, writer } = drawHeader({
      issuedAtLabel: '18 de agosto de 2026, 13:43',
    });
    const pageHeight = doc.internal.pageSize.getHeight();
    const rightX = pageWidth - PATIENT_PDF_PAGE_MARGIN_X;
    const headerDate = findText(texts, '18 de agosto de 2026, 13:43');

    expect(headerDate.align).toBe('right');
    expect(headerDate.y).toBeLessThan(pageHeight / 3);
    expect(
      texts.filter(
        (entry) =>
          entry.text === '18 de agosto de 2026' &&
          entry.y > pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM,
      ),
    ).toHaveLength(0);

    writer.ensureSpace(1000);

    const cornerDates = texts.filter(
      (entry) =>
        entry.text === '18 de agosto de 2026' &&
        entry.align === 'right' &&
        entry.x === rightX &&
        entry.y > pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM,
    );
    expect(cornerDates).toHaveLength(1);
  });

  it('does not stamp a corner date when stampCornerDate is false', () => {
    const { texts, pageWidth, doc, writer } = drawHeader({ stampCornerDate: false });
    const pageHeight = doc.internal.pageSize.getHeight();
    const rightX = pageWidth - PATIENT_PDF_PAGE_MARGIN_X;

    writer.ensureSpace(1000);

    const cornerDates = texts.filter(
      (entry) =>
        entry.text === '18 de agosto de 2026' &&
        entry.align === 'right' &&
        entry.x === rightX &&
        entry.y > pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM,
    );

    expect(cornerDates).toHaveLength(0);
    expect(findText(texts, '18 de agosto de 2026').align).toBe('right');
  });

  it('draws the clinic logo at a fixed header height, never at native pixel size', () => {
    const { images, texts } = drawHeader({
      logo: {
        dataUrl: 'data:image/jpeg;base64,AAAA',
        format: 'JPEG',
        width: 400,
        height: 400,
      },
    });
    const clinicName = findText(texts, 'Clínica Sorriso');
    const logo = images[0];

    expect(logo).toBeDefined();
    expect(logo?.h).toBe(PATIENT_PDF_HEADER_LOGO_HEIGHT_MM);
    expect(logo?.w).toBe(PATIENT_PDF_HEADER_LOGO_HEIGHT_MM);
    expect(logo?.w).toBeLessThan(400);
    expect(clinicName.x).toBeCloseTo(
      PATIENT_PDF_PAGE_MARGIN_X + (logo?.w ?? 0) + 4,
      5,
    );
  });
});

describe('drawPatientPdfFooter', () => {
  it('pins the generated-at rule and label to the bottom of every page', () => {
    const { doc, texts, lines, pageWidth, writer } = drawHeader({ stampCornerDate: false });
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - PATIENT_PDF_PAGE_MARGIN_X * 2;
    const generatedAt = new Date(2026, 7, 18, 14, 36, 0);

    writer.ensureSpace(1000);
    drawPatientPdfFooter(writer, generatedAt);

    const footers = texts.filter((entry) => entry.text.startsWith('Documento gerado em'));
    const footerRules = lines.filter(
      (line) =>
        Math.abs(line.x2 - line.x1 - contentWidth) < 1 && line.y1 > pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM,
    );

    expect(footers).toHaveLength(2);
    expect(footerRules).toHaveLength(2);
    for (const footer of footers) {
      expect(footer.x).toBe(PATIENT_PDF_PAGE_MARGIN_X);
      expect(footer.align).not.toBe('right');
      expect(footer.y).toBeGreaterThan(pageHeight - PATIENT_PDF_PAGE_MARGIN_BOTTOM);
      expect(footer.y).toBeLessThanOrEqual(pageHeight - 6);
      expect(footer.text).toMatch(/18 de agosto de 2026/);
      expect(footer.text).toMatch(/14:36/);
    }
    expect(footers.every((footer) => footer.text.startsWith('Documento gerado em'))).toBe(
      true,
    );
  });
});

describe('drawPatientPdfMetaRows', () => {
  it('places a trailing badge on the first row, right-aligned', () => {
    const { doc, texts, rects, pageWidth } = instrumentDoc();
    const writer = createPatientPdfWriter(doc);
    writer.cursorY = 80;

    drawPatientPdfMetaRows(
      writer,
      ['Paciente: Maria Silva', 'Responsável pelo orçamento: Dr. Ana'],
      {
        title: 'Plano de Procedimento',
        trailingBadge: {
          label: 'APROVADO',
          fill: [236, 253, 245],
          text: [4, 120, 87],
          border: [167, 243, 208],
        },
      },
    );

    const title = findText(texts, 'Plano de Procedimento');
    const patient = findText(texts, 'Paciente: Maria Silva');
    const badge = findText(texts, 'APROVADO');
    const responsible = findText(texts, 'Responsável pelo orçamento: Dr. Ana');
    const badgeRect = rects[0];

    expect(patient.y).toBeGreaterThan(title.y);
    expect(Math.abs(badge.y - patient.y)).toBeLessThan(2);
    expect(patient.x).toBe(PATIENT_PDF_PAGE_MARGIN_X);
    expect(badge.x).toBeGreaterThan(pageWidth / 2);
    expect(responsible.y).toBeGreaterThan(patient.y);
    expect(badgeRect).toBeDefined();
    expect((badgeRect?.x ?? 0) + (badgeRect?.w ?? 0)).toBeCloseTo(
      pageWidth - PATIENT_PDF_PAGE_MARGIN_X,
      0,
    );
  });
});

describe('mapClinicSettingsToPdfClinic', () => {
  it('formats the clinic address with commas, city /UF and zip without CEP label', () => {
    const mapped = mapClinicSettingsToPdfClinic(
      clinicSettings({
        street: 'Rua Victor Rosemberg',
        number: '43',
        neighborhood: 'Vila Lenzi',
        city: 'Jaraguá do Sul',
        state: 'SC',
        cep: '89252400',
      }),
    );

    expect(mapped.addressLine).toBe(
      'Rua Victor Rosemberg, 43, Vila Lenzi, Jaraguá do Sul /SC, 89252-400',
    );
    expect(mapped.addressLine).not.toMatch(/CEP/i);
  });

  it('includes complement between number and neighborhood', () => {
    const mapped = mapClinicSettingsToPdfClinic(
      clinicSettings({
        street: 'Rua Victor Rosemberg',
        number: '43',
        complement: 'Sala 2',
        neighborhood: 'Vila Lenzi',
        city: 'Jaraguá do Sul',
        state: 'sc',
        cep: '89252-400',
      }),
    );

    expect(mapped.addressLine).toBe(
      'Rua Victor Rosemberg, 43, Sala 2, Vila Lenzi, Jaraguá do Sul /SC, 89252-400',
    );
  });

  it('skips empty address parts', () => {
    const mapped = mapClinicSettingsToPdfClinic(
      clinicSettings({
        street: 'Rua das Flores',
        city: 'Ilhéus',
        state: 'BA',
      }),
    );

    expect(mapped.addressLine).toBe('Rua das Flores, Ilhéus /BA');
  });
});

describe('fitHeaderLogoDimensions', () => {
  it('locks height and scales a square logo instead of using native pixels', () => {
    expect(fitHeaderLogoDimensions(400, 400)).toEqual({
      width: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
      height: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
    });
  });

  it('keeps height fixed and lets width follow a wide logo', () => {
    expect(fitHeaderLogoDimensions(800, 200)).toEqual({
      width: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM * 4,
      height: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
    });
  });

  it('keeps height fixed and lets width follow a tall logo', () => {
    expect(fitHeaderLogoDimensions(200, 800)).toEqual({
      width: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM / 4,
      height: PATIENT_PDF_HEADER_LOGO_HEIGHT_MM,
    });
  });
});

describe('scaleLogoPixelSize', () => {
  it('keeps logos already within the PDF embed limit', () => {
    expect(scaleLogoPixelSize(200, 80, 384)).toEqual({ width: 200, height: 80 });
  });

  it('scales the longest edge down so the clinic logo does not inflate the PDF', () => {
    expect(scaleLogoPixelSize(4000, 3000, 384)).toEqual({ width: 384, height: 288 });
  });
});
