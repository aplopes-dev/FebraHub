export type ToothFaceLetter = 'M' | 'O' | 'D' | 'V' | 'P';

export const TOOTH_FACE_ORDER: ToothFaceLetter[] = ['M', 'O', 'D', 'V', 'P'];

export const TOOTH_FACE_UI_LABEL: Record<ToothFaceLetter, string> = {
  M: 'M',
  O: 'O/I',
  D: 'D',
  V: 'V',
  P: 'L/P',
};

const FACE_FROM_TOKEN: Record<string, ToothFaceLetter> = {
  M: 'M',
  O: 'O',
  'O/I': 'O',
  D: 'D',
  V: 'V',
  P: 'P',
  'L/P': 'P',
};

export type ParsedToothLocationLabel = {
  toothNumber: number;
  faces: ToothFaceLetter[];
};

export function formatToothLocationLabel(
  toothNumber: number,
  faces: readonly ToothFaceLetter[] = [],
): string {
  if (faces.length === 0) {
    return String(toothNumber);
  }

  const facesTxt = TOOTH_FACE_ORDER.filter((face) => faces.includes(face))
    .map((face) => TOOTH_FACE_UI_LABEL[face])
    .join(',');

  return `${toothNumber} · ${facesTxt}`;
}

export function parseToothLocationLabel(
  label: string,
): ParsedToothLocationLabel | null {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+)\s*(?:[·•]\s*(.+))?$/u);
  if (!match) return null;

  const toothNumber = Number.parseInt(match[1]!, 10);
  if (Number.isNaN(toothNumber) || toothNumber <= 0) return null;

  const facesPart = match[2]?.trim();
  if (!facesPart) {
    return { toothNumber, faces: [] };
  }

  const tokens = facesPart
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const faces: ToothFaceLetter[] = [];
  for (const token of tokens) {
    const face = FACE_FROM_TOKEN[token.toUpperCase()] ?? FACE_FROM_TOKEN[token];
    if (!face) return null;
    if (!faces.includes(face)) {
      faces.push(face);
    }
  }

  return {
    toothNumber,
    faces: TOOTH_FACE_ORDER.filter((face) => faces.includes(face)),
  };
}

export function normalizeToothLocationLabel(label: string): string | null {
  const parsed = parseToothLocationLabel(label);
  if (!parsed) return null;
  return formatToothLocationLabel(parsed.toothNumber, parsed.faces);
}
