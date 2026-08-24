import { PATIENT_REFERRAL_SOURCE_OPTIONS } from '@/features/clinic/modules/patients/lib/patient-form-options';
import type {
  DashboardAcquisitionAggregate,
  DashboardAcquisitionPatient,
  DashboardAcquisitionPeriodMode,
  DashboardPatientAcquisitionResult,
  DashboardReferralSourceKey,
} from '../types/clinic-dashboard';
import { REFERRAL_SOURCE_COLORS } from '../data/mock-dashboard-patient-acquisition';
import { buildFinancialPeriodKey } from './dashboard-financial';

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

export function getDashboardReferralSourceLabel(
  source: DashboardReferralSourceKey,
): string {
  if (source === 'nao_informado') return 'Não informado';
  if (source === 'indicacao') return 'Indicado por outro paciente';
  if (source === 'indicacao_profissional') {
    return 'Indicado por outro profissional da equipe';
  }
  if (source === 'indicacao_profissional_externo') {
    return 'Indicado por outro profissional externo';
  }
  return (
    PATIENT_REFERRAL_SOURCE_OPTIONS.find((option) => option.value === source)
      ?.label ?? source
  );
}

/** Quebra rótulos longos do eixo Y em até 2 linhas (sem cortar no meio da palavra). */
export function wrapAcquisitionYAxisLabel(
  label: string,
  maxCharsPerLine = 26,
): string[] {
  const text = label.trim();
  if (!text) return [''];
  if (text.length <= maxCharsPerLine) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
      if (lines.length >= 2) {
        current = '';
        break;
      }
    } else {
      current = next;
    }
  }

  if (current && lines.length < 2) {
    lines.push(current);
  }

  return lines.length > 0 ? lines.slice(0, 2) : [text];
}

/** Anexa cores do gráfico às agregações vindas da API. */
export function mapAcquisitionAggregatesWithColors(
  aggregates: DashboardPatientAcquisitionResult['aggregates'],
): DashboardAcquisitionAggregate[] {
  return aggregates.map((row) => ({
    ...row,
    color: REFERRAL_SOURCE_COLORS[row.source],
  }));
}

export function filterPatientsByRegistrationPeriod(
  patients: readonly DashboardAcquisitionPatient[],
  input: {
    mode: DashboardAcquisitionPeriodMode;
    year: number;
    month: number;
  },
): DashboardAcquisitionPatient[] {
  const { mode, year, month } = input;
  if (mode === 'annual') {
    const prefix = String(year);
    return patients.filter((patient) =>
      patient.registeredAt.startsWith(prefix),
    );
  }
  const prefix = buildFinancialPeriodKey(year, month);
  return patients.filter((patient) => patient.registeredAt.startsWith(prefix));
}

export function aggregateByReferralSource(
  patients: readonly DashboardAcquisitionPatient[],
): DashboardAcquisitionAggregate[] {
  const total = patients.length;
  const counts = new Map<DashboardReferralSourceKey, number>();

  for (const patient of patients) {
    counts.set(
      patient.referralSource,
      (counts.get(patient.referralSource) ?? 0) + 1,
    );
  }

  return SOURCE_ORDER.filter((source) => (counts.get(source) ?? 0) > 0).map(
    (source) => {
      const count = counts.get(source) ?? 0;
      return {
        source,
        label: getDashboardReferralSourceLabel(source),
        color: REFERRAL_SOURCE_COLORS[source],
        count,
        percent:
          total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    },
  );
}

export function patientsForReferralSource(
  patients: readonly DashboardAcquisitionPatient[],
  source: DashboardReferralSourceKey,
): DashboardAcquisitionPatient[] {
  return patients.filter((patient) => patient.referralSource === source);
}
