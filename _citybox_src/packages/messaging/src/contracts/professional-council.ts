/**
 * Conselho de classe na vertical Clínica (CRM/CRO/CREFITO/CRN).
 *
 * CREFITO usa `councilUf` Char(2) como regional zero-padded (`01`–`20`), não UF.
 * CRM/CRO/CRN continuam com sigla de estado (`BA`, `SP`, …).
 */

export const PROFESSIONAL_COUNCIL_TYPES = [
  'CRM',
  'CRO',
  'CREFITO',
  'CRN',
] as const;

export type ProfessionalCouncilType = (typeof PROFESSIONAL_COUNCIL_TYPES)[number];

export const BRAZILIAN_COUNCIL_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type BrazilianCouncilUf = (typeof BRAZILIAN_COUNCIL_UFS)[number];

export type CrefitoRegional = {
  number: number;
  stateAbbreviations: readonly string[];
};

/** Regionais oficiais CREFITO (1–20). Fonte única para API + web. */
export const CREFITO_REGIONALS: readonly CrefitoRegional[] = [
  { number: 1, stateAbbreviations: ['PE', 'PB', 'AL', 'RN'] },
  { number: 2, stateAbbreviations: ['RJ'] },
  { number: 3, stateAbbreviations: ['SP'] },
  { number: 4, stateAbbreviations: ['MG'] },
  { number: 5, stateAbbreviations: ['RS'] },
  { number: 6, stateAbbreviations: ['CE'] },
  { number: 7, stateAbbreviations: ['BA'] },
  { number: 8, stateAbbreviations: ['PR'] },
  { number: 9, stateAbbreviations: ['MT'] },
  { number: 10, stateAbbreviations: ['SC'] },
  { number: 11, stateAbbreviations: ['DF'] },
  { number: 12, stateAbbreviations: ['PA', 'TO', 'AP'] },
  { number: 13, stateAbbreviations: ['MS'] },
  { number: 14, stateAbbreviations: ['PI'] },
  { number: 15, stateAbbreviations: ['ES'] },
  { number: 16, stateAbbreviations: ['MA'] },
  { number: 17, stateAbbreviations: ['SE'] },
  { number: 18, stateAbbreviations: ['RO', 'AC'] },
  { number: 19, stateAbbreviations: ['GO'] },
  { number: 20, stateAbbreviations: ['AM', 'RR'] },
] as const;

const UF_SET = new Set<string>(BRAZILIAN_COUNCIL_UFS);
const CREFITO_REGIONAL_BY_NUMBER = new Map(
  CREFITO_REGIONALS.map((regional) => [regional.number, regional]),
);

export type ProfessionalCouncilSnapshot = {
  councilType: ProfessionalCouncilType;
  councilNumber: string;
  councilUf: string;
};

export type ProfessionalCouncilFields = {
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
};

export type ProfessionalCouncilInput = {
  councilType?: string | null;
  councilNumber?: string | null;
  councilUf?: string | null;
};

export function formatCrefitoRegionalOptionLabel(regional: CrefitoRegional): string {
  return `${regional.number} — ${regional.stateAbbreviations.join(', ')}`;
}

export function formatCrefitoRegionalStorage(number: number): string {
  return String(number).padStart(2, '0');
}

export function parseCrefitoRegionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,2}$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    return null;
  }
  return parsed;
}

export function isValidCrefitoRegionalStorage(code: string): boolean {
  const trimmed = code.trim();
  if (!/^\d{2}$/.test(trimmed)) {
    return false;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 20;
}

export function normalizeCouncilUfForType(
  councilType: ProfessionalCouncilType,
  raw: string,
): string | null {
  if (councilType === 'CREFITO') {
    const fromNumber = parseCrefitoRegionalNumber(raw);
    if (fromNumber != null) {
      return formatCrefitoRegionalStorage(fromNumber);
    }
    if (isValidCrefitoRegionalStorage(raw)) {
      return raw.trim();
    }
    return null;
  }

  const uf = raw.trim().toUpperCase();
  return UF_SET.has(uf) ? uf : null;
}

export function isProfessionalCouncilType(
  value: string | null | undefined,
): value is ProfessionalCouncilType {
  return (
    value === 'CRM' ||
    value === 'CRO' ||
    value === 'CREFITO' ||
    value === 'CRN'
  );
}

export function hasCompleteProfessionalCouncil(
  fields: ProfessionalCouncilFields | null | undefined,
): fields is ProfessionalCouncilSnapshot {
  if (!fields) {
    return false;
  }

  const councilNumber = fields.councilNumber?.trim() ?? '';
  if (!isProfessionalCouncilType(fields.councilType) || !/^\d+$/.test(councilNumber)) {
    return false;
  }

  const councilUf = normalizeCouncilUfForType(
    fields.councilType,
    fields.councilUf?.trim() ?? '',
  );
  return councilUf != null;
}

export function toProfessionalCouncilSnapshot(
  fields: ProfessionalCouncilFields,
): ProfessionalCouncilSnapshot | null {
  if (!hasCompleteProfessionalCouncil(fields)) {
    return null;
  }

  const councilUf = normalizeCouncilUfForType(
    fields.councilType,
    fields.councilUf?.trim() ?? '',
  );
  if (councilUf == null) {
    return null;
  }

  return {
    councilType: fields.councilType,
    councilNumber: fields.councilNumber.trim(),
    councilUf,
  };
}

export function parseProfessionalCouncilInput(
  input: ProfessionalCouncilInput | null | undefined,
  options?: { allowedTypes?: readonly string[] },
): ProfessionalCouncilSnapshot | null {
  if (!input) {
    return null;
  }

  const councilTypeRaw = input.councilType?.trim().toUpperCase();
  if (!isProfessionalCouncilType(councilTypeRaw)) {
    return null;
  }

  const allowed = options?.allowedTypes;
  if (allowed && !allowed.includes(councilTypeRaw)) {
    return null;
  }

  const councilNumber = input.councilNumber?.trim() ?? '';
  if (!/^\d+$/.test(councilNumber)) {
    return null;
  }

  const councilUf = normalizeCouncilUfForType(
    councilTypeRaw,
    input.councilUf?.trim() ?? '',
  );
  if (councilUf == null) {
    return null;
  }

  return {
    councilType: councilTypeRaw,
    councilNumber,
    councilUf,
  };
}

/** Label para PDF / UI: `CRO-BA 12345`, `CRN-BA 12345` ou `CREFITO-7 12345`. */
export function formatProfessionalCouncilLabel(
  fields: ProfessionalCouncilFields | null | undefined,
): string {
  const snapshot = fields ? toProfessionalCouncilSnapshot(fields) : null;
  if (!snapshot) {
    return '';
  }

  if (snapshot.councilType === 'CREFITO') {
    const regional = Number(snapshot.councilUf);
    return `CREFITO-${regional} ${snapshot.councilNumber}`;
  }

  return `${snapshot.councilType}-${snapshot.councilUf} ${snapshot.councilNumber}`;
}

export function getCrefitoRegionalByStorage(code: string): CrefitoRegional | null {
  if (!isValidCrefitoRegionalStorage(code)) {
    return null;
  }
  return CREFITO_REGIONAL_BY_NUMBER.get(Number(code)) ?? null;
}
