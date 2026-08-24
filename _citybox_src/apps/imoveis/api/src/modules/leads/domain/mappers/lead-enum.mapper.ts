/** Prisma snake_case ↔ HTTP/UI kebab-case for lead enums. */

export type ApiLeadStatus =
  | 'new'
  | 'negotiating'
  | 'scheduled-visit'
  | 'closed-won'
  | 'cancelled';

export type PrismaLeadStatus =
  | 'new'
  | 'negotiating'
  | 'scheduled_visit'
  | 'closed_won'
  | 'cancelled';

export type ApiLeadSource =
  | 'walk-in'
  | 'website'
  | 'referral'
  | 'social'
  | 'ads'
  | 'whatsapp';

export type PrismaLeadSource =
  | 'walk_in'
  | 'website'
  | 'referral'
  | 'social'
  | 'ads'
  | 'whatsapp';

export type ApiLeadPurpose = 'buying' | 'renting' | 'selling';
export type PrismaLeadPurpose = ApiLeadPurpose;

export const API_LEAD_PAYMENT_INTENTS = [
  'cash',
  'financing',
  'fgts',
  'trade-in',
] as const;

export type ApiLeadPaymentIntent = (typeof API_LEAD_PAYMENT_INTENTS)[number];
export type PrismaLeadPaymentIntent =
  | 'cash'
  | 'financing'
  | 'fgts'
  | 'trade_in';

export type ApiPropertyType =
  | 'house'
  | 'apartment'
  | 'villa'
  | 'land'
  | 'commercial';
export type PrismaPropertyType = ApiPropertyType;

export type ApiLeadActivityType =
  | 'note'
  | 'system'
  | 'status'
  | 'assignment'
  | 'document'
  | 'property';
export type PrismaLeadActivityType = ApiLeadActivityType;

const STATUS_TO_PRISMA: Record<ApiLeadStatus, PrismaLeadStatus> = {
  new: 'new',
  negotiating: 'negotiating',
  'scheduled-visit': 'scheduled_visit',
  'closed-won': 'closed_won',
  cancelled: 'cancelled',
};

const STATUS_TO_API: Record<PrismaLeadStatus, ApiLeadStatus> = {
  new: 'new',
  negotiating: 'negotiating',
  scheduled_visit: 'scheduled-visit',
  closed_won: 'closed-won',
  cancelled: 'cancelled',
};

const SOURCE_TO_PRISMA: Record<ApiLeadSource, PrismaLeadSource> = {
  'walk-in': 'walk_in',
  website: 'website',
  referral: 'referral',
  social: 'social',
  ads: 'ads',
  whatsapp: 'whatsapp',
};

const SOURCE_TO_API: Record<PrismaLeadSource, ApiLeadSource> = {
  walk_in: 'walk-in',
  website: 'website',
  referral: 'referral',
  social: 'social',
  ads: 'ads',
  whatsapp: 'whatsapp',
};

export function statusToPrisma(value: string): PrismaLeadStatus {
  const mapped = STATUS_TO_PRISMA[value as ApiLeadStatus];
  if (!mapped) throw new Error(`Invalid lead status: ${value}`);
  return mapped;
}

export function statusToApi(value: string): ApiLeadStatus {
  const mapped = STATUS_TO_API[value as PrismaLeadStatus];
  if (!mapped) throw new Error(`Invalid prisma lead status: ${value}`);
  return mapped;
}

export function sourceToPrisma(value: string): PrismaLeadSource {
  const mapped = SOURCE_TO_PRISMA[value as ApiLeadSource];
  if (!mapped) throw new Error(`Invalid lead source: ${value}`);
  return mapped;
}

export function sourceToApi(value: string): ApiLeadSource {
  const mapped = SOURCE_TO_API[value as PrismaLeadSource];
  if (!mapped) throw new Error(`Invalid prisma lead source: ${value}`);
  return mapped;
}

export function parseCsvStatuses(raw?: string | string[]): ApiLeadStatus[] {
  return splitCsv(raw).map((v) => {
    if (!(v in STATUS_TO_PRISMA))
      throw new Error(`Invalid status filter: ${v}`);
    return v as ApiLeadStatus;
  });
}

export function parseCsvSources(raw?: string | string[]): ApiLeadSource[] {
  return splitCsv(raw).map((v) => {
    if (!(v in SOURCE_TO_PRISMA))
      throw new Error(`Invalid source filter: ${v}`);
    return v as ApiLeadSource;
  });
}

export function parseCsvPurposes(raw?: string | string[]): ApiLeadPurpose[] {
  const allowed = new Set(['buying', 'renting', 'selling']);
  return splitCsv(raw).map((v) => {
    if (!allowed.has(v)) throw new Error(`Invalid purpose filter: ${v}`);
    return v as ApiLeadPurpose;
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

function splitCsv(raw?: string | string[]): string[] {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : raw.split(',');
  return parts.map((p) => p.trim()).filter(Boolean);
}

export const PROPERTY_TYPE_LABEL: Record<ApiPropertyType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  villa: 'Cobertura',
  land: 'Terreno',
  commercial: 'Comercial',
};

export const PURPOSE_LABEL: Record<ApiLeadPurpose, string> = {
  buying: 'Comprar',
  renting: 'Alugar',
  selling: 'Vender',
};

/** Rótulos de UI para intenção de pagamento (qualificação do lead). */
export const PAYMENT_INTENT_LABEL: Record<ApiLeadPaymentIntent, string> = {
  cash: 'À vista',
  financing: 'Financiamento bancário',
  fgts: 'FGTS',
  'trade-in': 'Permuta / dação de imóvel',
};

const INTENT_TO_PRISMA: Record<ApiLeadPaymentIntent, PrismaLeadPaymentIntent> =
  {
    cash: 'cash',
    financing: 'financing',
    fgts: 'fgts',
    'trade-in': 'trade_in',
  };

const INTENT_TO_API: Record<PrismaLeadPaymentIntent, ApiLeadPaymentIntent> = {
  cash: 'cash',
  financing: 'financing',
  fgts: 'fgts',
  trade_in: 'trade-in',
};

export function isApiLeadPaymentIntent(
  value: string,
): value is ApiLeadPaymentIntent {
  return (API_LEAD_PAYMENT_INTENTS as readonly string[]).includes(value);
}

export function normalizePaymentIntents(
  raw?: readonly string[],
): ApiLeadPaymentIntent[] {
  if (!raw?.length) return [];
  const selected = new Set(
    raw.filter((item): item is ApiLeadPaymentIntent =>
      isApiLeadPaymentIntent(item),
    ),
  );
  return API_LEAD_PAYMENT_INTENTS.filter((item) => selected.has(item));
}

export function paymentIntentsToPrisma(
  raw?: readonly string[],
): PrismaLeadPaymentIntent[] {
  return normalizePaymentIntents(raw).map((item) => INTENT_TO_PRISMA[item]);
}

export function paymentIntentsToApi(
  raw?: readonly string[],
): ApiLeadPaymentIntent[] {
  if (!raw?.length) return [];
  return normalizePaymentIntents(
    raw.map((item) => INTENT_TO_API[item as PrismaLeadPaymentIntent] ?? item),
  );
}
