import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import {
  civilDayEndUtc,
  civilDayStartUtc,
} from './dashboard-patients.dates';
import type {
  DashboardAcquisitionAggregate,
  DashboardAcquisitionPatientItem,
  DashboardAcquisitionPeriodMode,
  DashboardReferralSourceKey,
  PatientAcquisitionRow,
} from './dashboard-patient-acquisition.types';

const SOURCE_ORDER: DashboardReferralSourceKey[] = [
  'facebook',
  'instagram',
  'google',
  'indicacao',
  'indicacao_profissional',
  'indicacao_profissional_externo',
  'outro',
  'nao_informado',
];

const SOURCE_LABELS: Record<DashboardReferralSourceKey, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  indicacao: 'Indicado por outro paciente',
  indicacao_profissional: 'Indicado por outro profissional da equipe',
  indicacao_profissional_externo: 'Indicado por outro profissional externo',
  outro: 'Outro',
  nao_informado: 'Não informado',
};

export function resolvePatientAcquisitionPeriodRange(input: {
  periodMode: DashboardAcquisitionPeriodMode;
  year: number;
  month?: number;
}): { startIsoDate: string; endIsoDate: string; startAt: Date; endAt: Date } {
  const { periodMode, year, month } = input;
  let startIsoDate: string;
  let endIsoDate: string;

  if (periodMode === 'annual') {
    startIsoDate = `${year}-01-01`;
    endIsoDate = `${year}-12-31`;
  } else {
    if (month == null || month < 1 || month > 12) {
      throw new Error('month is required for monthly periodMode');
    }
    const padded = String(month).padStart(2, '0');
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    startIsoDate = `${year}-${padded}-01`;
    endIsoDate = `${year}-${padded}-${String(days).padStart(2, '0')}`;
  }

  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

export function mapReferralSourceToUi(
  row: Pick<
    PatientAcquisitionRow,
    'referralOriginSystemKey' | 'referralOriginName'
  >,
): DashboardReferralSourceKey {
  const key = row.referralOriginSystemKey;
  if (
    key === 'indicacao' ||
    key === 'indicacao_profissional' ||
    key === 'indicacao_profissional_externo' ||
    key === 'google' ||
    key === 'instagram' ||
    key === 'facebook' ||
    key === 'outro'
  ) {
    return key;
  }
  if (row.referralOriginName?.trim()) {
    return 'outro';
  }
  return 'nao_informado';
}

export function getReferralSourceLabel(
  source: DashboardReferralSourceKey,
): string {
  return SOURCE_LABELS[source];
}

export function toAcquisitionPatientItem(
  row: PatientAcquisitionRow,
): DashboardAcquisitionPatientItem {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    cpf: row.cpf,
    registeredAt: toIsoDateOnly(row.createdAt),
    referralSource: mapReferralSourceToUi(row),
  };
}

export function aggregatePatientAcquisition(
  rows: readonly PatientAcquisitionRow[],
): { totalCount: number; aggregates: DashboardAcquisitionAggregate[] } {
  const totalCount = rows.length;
  const counts = new Map<DashboardReferralSourceKey, number>();

  for (const row of rows) {
    const source = mapReferralSourceToUi(row);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  const aggregates = SOURCE_ORDER.filter(
    (source) => (counts.get(source) ?? 0) > 0,
  ).map((source) => {
    const count = counts.get(source) ?? 0;
    return {
      source,
      label: getReferralSourceLabel(source),
      count,
      percent:
        totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
    };
  });

  return { totalCount, aggregates };
}

export function filterPatientAcquisitionDetails(input: {
  rows: readonly PatientAcquisitionRow[];
  source: DashboardReferralSourceKey;
  search?: string;
}): DashboardAcquisitionPatientItem[] {
  const query = input.search?.trim().toLocaleLowerCase('pt-BR') ?? '';
  const digits = query.replace(/\D/g, '');

  return input.rows
    .filter((row) => mapReferralSourceToUi(row) === input.source)
    .map(toAcquisitionPatientItem)
    .filter((item) => {
      if (!query) return true;
      const nameMatch = item.name.toLocaleLowerCase('pt-BR').includes(query);
      const emailMatch = item.email
        .toLocaleLowerCase('pt-BR')
        .includes(query);
      const phoneMatch =
        item.phone.includes(query) ||
        (digits.length > 0 && item.phone.includes(digits));
      const cpfMatch =
        item.cpf != null &&
        (item.cpf.includes(query) ||
          (digits.length > 0 && item.cpf.includes(digits)));
      return nameMatch || emailMatch || phoneMatch || cpfMatch;
    })
    .sort((a, b) => {
      const byDate = b.registeredAt.localeCompare(a.registeredAt);
      if (byDate !== 0) return byDate;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
}
