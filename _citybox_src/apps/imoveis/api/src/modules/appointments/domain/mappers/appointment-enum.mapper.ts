/** Prisma snake_case ↔ HTTP/UI kebab-case for appointment enums. */

export type ApiAppointmentKind = 'visit' | 'follow-up' | 'signing' | 'other';

export type PrismaAppointmentKind = 'visit' | 'follow_up' | 'signing' | 'other';

const KIND_TO_PRISMA: Record<ApiAppointmentKind, PrismaAppointmentKind> = {
  visit: 'visit',
  'follow-up': 'follow_up',
  signing: 'signing',
  other: 'other',
};

const KIND_TO_API: Record<PrismaAppointmentKind, ApiAppointmentKind> = {
  visit: 'visit',
  follow_up: 'follow-up',
  signing: 'signing',
  other: 'other',
};

export function appointmentKindToPrisma(
  kind: ApiAppointmentKind,
): PrismaAppointmentKind {
  return KIND_TO_PRISMA[kind];
}

export function appointmentKindToApi(
  kind: PrismaAppointmentKind,
): ApiAppointmentKind {
  return KIND_TO_API[kind];
}

export function parseAppointmentKind(value: string): ApiAppointmentKind {
  if (value in KIND_TO_PRISMA) return value as ApiAppointmentKind;
  throw new Error(`Invalid appointment kind: ${value}`);
}

export function parseCsvAppointmentKinds(
  values?: string[],
): ApiAppointmentKind[] | undefined {
  if (!values?.length) return undefined;
  return values.map((v) => parseAppointmentKind(v.trim())).filter(Boolean);
}
