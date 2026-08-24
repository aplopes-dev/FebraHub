/** Prisma snake_case ↔ HTTP/UI kebab-case for property enums. */

export type ApiPropertyType =
  | 'house'
  | 'apartment'
  | 'villa'
  | 'land'
  | 'commercial';
export type PrismaPropertyType = ApiPropertyType;

export type ApiPropertyStatus =
  | 'available'
  | 'occupied'
  | 'sold-out'
  | 'reserved';

export type PrismaPropertyStatus =
  | 'available'
  | 'occupied'
  | 'sold_out'
  | 'reserved';

export type ApiListingType = 'sale' | 'rent';
export type PrismaListingType = ApiListingType;

const STATUS_TO_PRISMA: Record<ApiPropertyStatus, PrismaPropertyStatus> = {
  available: 'available',
  occupied: 'occupied',
  'sold-out': 'sold_out',
  reserved: 'reserved',
};

const STATUS_TO_API: Record<PrismaPropertyStatus, ApiPropertyStatus> = {
  available: 'available',
  occupied: 'occupied',
  sold_out: 'sold-out',
  reserved: 'reserved',
};

export function propertyStatusToPrisma(value: string): PrismaPropertyStatus {
  const mapped = STATUS_TO_PRISMA[value as ApiPropertyStatus];
  if (!mapped) throw new Error(`Invalid property status: ${value}`);
  return mapped;
}

export function propertyStatusToApi(value: string): ApiPropertyStatus {
  const mapped = STATUS_TO_API[value as PrismaPropertyStatus];
  if (!mapped) throw new Error(`Invalid prisma property status: ${value}`);
  return mapped;
}

export function parseCsvPropertyStatuses(
  raw?: string | string[],
): ApiPropertyStatus[] {
  return splitCsv(raw).map((v) => {
    if (!(v in STATUS_TO_PRISMA))
      throw new Error(`Invalid status filter: ${v}`);
    return v as ApiPropertyStatus;
  });
}

export function parseCsvPropertyTypes(
  raw?: string | string[],
): ApiPropertyType[] {
  const allowed = new Set([
    'house',
    'apartment',
    'villa',
    'land',
    'commercial',
  ]);
  return splitCsv(raw).map((v) => {
    if (!allowed.has(v)) throw new Error(`Invalid property type filter: ${v}`);
    return v as ApiPropertyType;
  });
}

export function parseCsvListingTypes(
  raw?: string | string[],
): ApiListingType[] {
  const allowed = new Set(['sale', 'rent']);
  return splitCsv(raw).map((v) => {
    if (!allowed.has(v)) throw new Error(`Invalid listing type filter: ${v}`);
    return v as ApiListingType;
  });
}

export function parseCsvNegotiable(raw?: string | string[]): ('yes' | 'no')[] {
  const allowed = new Set(['yes', 'no']);
  return splitCsv(raw).map((v) => {
    if (!allowed.has(v)) throw new Error(`Invalid negotiable filter: ${v}`);
    return v as 'yes' | 'no';
  });
}

function splitCsv(raw?: string | string[]): string[] {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : raw.split(',');
  return parts.map((p) => p.trim()).filter(Boolean);
}
