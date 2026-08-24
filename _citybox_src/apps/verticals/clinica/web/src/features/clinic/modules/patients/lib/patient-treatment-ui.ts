import { formatPatientBudgetToothLabel } from './patient-budget-tooth-numbers';
import { formatBodyRegionDisplayLabel, parseBodyRegionIdFromLabel } from '@/lib/body-region-location';
import {
  parseToothLocationLabel,
  TOOTH_FACE_ORDER,
  TOOTH_FACE_UI_LABEL,
} from './tooth-location-label';
import type {
  PatientTreatment,
  PatientTreatmentEvolution,
  PatientTreatmentSource,
} from '../types/patient-treatment';

export const PATIENT_EVOLUTION_SIGNATURE_STATUS_LABEL: Record<
  PatientTreatmentEvolution['signatureStatus'],
  string
> = {
  unsigned: 'Sem assinatura',
  pending: 'Pendente',
  signed: 'Assinada',
};

export const PATIENT_EVOLUTION_SIGNATURE_STATUS_BADGE_CLASS: Record<
  PatientTreatmentEvolution['signatureStatus'],
  string
> = {
  unsigned: 'border-border/60 bg-muted/60 text-muted-foreground',
  pending: 'border-[#D4B84A]/40 bg-[#F5E9B8]/70 text-[#B8961A]',
  signed: 'border-green-600/25 bg-green-50 text-green-700',
};

export function buildBudgetTreatmentId(budgetId: string, treatmentItemId: string): string {
  return `${budgetId}:${treatmentItemId}`;
}

export function formatPatientTreatmentDescription(
  treatmentName: string,
  toothNumber?: number,
  locationType?: PatientTreatment['locationType'],
  locationLabel?: string,
  sessionIndex?: number | null,
  sessionTotal?: number | null,
): string {
  const withSessionSuffix = (label: string): string => {
    if (
      typeof sessionTotal === 'number' &&
      sessionTotal >= 2 &&
      typeof sessionIndex === 'number' &&
      sessionIndex >= 1
    ) {
      return `${label} - ${sessionIndex}/${sessionTotal}`;
    }
    return label;
  };

  if (locationType === 'session') {
    return withSessionSuffix(`${treatmentName} — Sessão`);
  }

  if (locationType === 'none') {
    return withSessionSuffix(treatmentName);
  }

  if (locationType === 'body_region' || (toothNumber === 0 && locationLabel?.trim())) {
    return withSessionSuffix(
      `${treatmentName} — ${formatBodyRegionDisplayLabel(locationLabel)}`,
    );
  }

  if (toothNumber !== undefined && toothNumber > 0) {
    return withSessionSuffix(
      `${treatmentName} — ${formatPatientBudgetToothLabel(toothNumber)}`,
    );
  }

  if (locationLabel?.trim()) {
    return withSessionSuffix(`${treatmentName} — ${locationLabel.trim()}`);
  }

  return withSessionSuffix(treatmentName);
}

export function formatPatientTreatmentLabel(
  treatment: Pick<
    PatientTreatment,
    | 'description'
    | 'treatmentName'
    | 'toothNumber'
    | 'locationType'
    | 'locationLabel'
    | 'sessionIndex'
    | 'sessionTotal'
  >,
): string {
  const name = treatment.treatmentName?.trim() || treatment.description.trim();
  return formatPatientTreatmentDescription(
    name,
    treatment.toothNumber,
    treatment.locationType,
    treatment.locationLabel,
    treatment.sessionIndex,
    treatment.sessionTotal,
  );
}

/** Fragmento no meio da frase (faces/regiões) — sem maiúsculas forçadas. */
function toEvolutionLocationFragment(label: string): string {
  return label.trim().toLocaleLowerCase('pt-BR');
}

type TreatmentFinalizeSubjectInput = Pick<
  PatientTreatment,
  | 'description'
  | 'treatmentName'
  | 'toothNumber'
  | 'locationType'
  | 'locationLabel'
  | 'sessionIndex'
  | 'sessionTotal'
>;

/**
 * Sujeito da frase de evolução (sem "foi/foram finalizado(s).").
 * Ex.: `Clareamento em Consultório do dente 23`
 */
export function buildTreatmentFinalizeEvolutionSubject(
  treatment: TreatmentFinalizeSubjectInput,
): string {
  const name =
    treatment.treatmentName?.trim() || treatment.description.trim() || 'Procedimento';

  const sessionSuffix = (() => {
    const total = treatment.sessionTotal;
    const index = treatment.sessionIndex;
    if (
      typeof total === 'number' &&
      total >= 2 &&
      typeof index === 'number' &&
      index >= 1 &&
      index <= total
    ) {
      return ` - sessão ${index}/${total}`;
    }
    return '';
  })();

  const withSession = (base: string): string => `${base}${sessionSuffix}`;

  const parsedFaces =
    treatment.locationType === 'tooth' && treatment.locationLabel?.trim()
      ? (parseToothLocationLabel(treatment.locationLabel)?.faces ?? [])
      : [];

  if (parsedFaces.length > 0) {
    const facesTxt = TOOTH_FACE_ORDER.filter((face) => parsedFaces.includes(face))
      .map((face) => toEvolutionLocationFragment(TOOTH_FACE_UI_LABEL[face]))
      .join(', ');
    const facePhrase =
      parsedFaces.length === 1 ? `da face ${facesTxt}` : `das faces ${facesTxt}`;
    return withSession(`${name} ${facePhrase}`);
  }

  if (treatment.toothNumber != null && treatment.toothNumber > 0) {
    return withSession(
      `${name} do dente ${formatPatientBudgetToothLabel(treatment.toothNumber)}`,
    );
  }

  if (treatment.locationType === 'body_region' && treatment.locationLabel?.trim()) {
    const regionLabel = formatBodyRegionDisplayLabel(treatment.locationLabel);
    const fragment = toEvolutionLocationFragment(regionLabel);
    if (parseBodyRegionIdFromLabel(treatment.locationLabel)) {
      return withSession(`${name} da região ${fragment}`);
    }
    return withSession(`${name} da ${fragment}`);
  }

  if (treatment.locationType === 'session') {
    if (sessionSuffix) {
      return withSession(name);
    }
    return `${name} da sessão`;
  }

  return withSession(name);
}

/**
 * Texto padrão da evolução ao abrir "Finalizar procedimento(s)".
 * - 1 item: `{sujeito} foi finalizado.`
 * - N itens: `{sujeito1}, {sujeito2} foram finalizados.`
 */
export function buildDefaultTreatmentFinalizeEvolutionNotes(
  treatments: TreatmentFinalizeSubjectInput | TreatmentFinalizeSubjectInput[],
): string {
  const list = Array.isArray(treatments) ? treatments : [treatments];
  if (list.length === 0) {
    return '';
  }

  const subjects = list.map((treatment) => buildTreatmentFinalizeEvolutionSubject(treatment));
  if (subjects.length === 1) {
    return `${subjects[0]} foi finalizado.`;
  }

  return `${subjects.join(', ')} foram finalizados.`;
}

/** Prefixo clínico exibido na lista de procedimentos do Prontuário. */
const TREATMENT_PROFESSIONAL_TITLE = 'Dr(a)';

/**
 * Garante `Dr(a) Nome Completo` — não duplica se o snapshot já vier com Dr/Dra/Dr(a).
 */
export function formatPatientTreatmentProfessionalLabel(
  professionalName?: string,
): string | null {
  const trimmed = professionalName?.trim();
  if (!trimmed) return null;
  if (/^dr\(a\)\.?\s/i.test(trimmed) || /^dra?\.?\s/i.test(trimmed)) {
    // Normaliza título legado (`Dr.`, `Dra.`, `Dr(a).`) para o padrão `Dr(a)`.
    const withoutTitle = trimmed.replace(/^(dr\(a\)|dra?)\.?\s+/i, '').trim();
    return withoutTitle
      ? `${TREATMENT_PROFESSIONAL_TITLE} ${withoutTitle}`
      : TREATMENT_PROFESSIONAL_TITLE;
  }
  return `${TREATMENT_PROFESSIONAL_TITLE} ${trimmed}`;
}

/**
 * Subtítulo sob o nome do procedimento: `Dr(a) Nome Completo - Plano`.
 */
export function formatPatientTreatmentSubtitle(
  planName?: string,
  professionalName?: string,
): string | null {
  const plan = planName?.trim();
  const professional = formatPatientTreatmentProfessionalLabel(professionalName);

  if (professional && plan) {
    return `${professional} - ${plan}`;
  }

  if (professional) {
    return professional;
  }

  if (plan) {
    return plan;
  }

  return null;
}

export function getPatientTreatmentSourceLabel(source: PatientTreatmentSource): string {
  return source === 'standalone' ? 'Avulso' : 'Orçamento';
}

export function getPatientTreatmentStatusLabel(status: 'active' | 'finalized'): string {
  return status === 'finalized' ? 'Finalizado' : 'Ativo';
}

export function formatPatientTreatmentFinalizedDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

/** Timestamp da atividade relevante para pintar o odontograma (mais recente ganha por dente). */
export function getPatientTreatmentOdontogramActivityTime(
  treatment: PatientTreatment,
): number {
  if (treatment.status === 'finalized' && treatment.finalizedAt) {
    const finalizedMs = Date.parse(treatment.finalizedAt);
    if (!Number.isNaN(finalizedMs)) {
      return finalizedMs;
    }
  }

  for (const iso of [treatment.updatedAt, treatment.createdAt]) {
    if (!iso) continue;
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms)) {
      return ms;
    }
  }

  return 0;
}

/**
 * Odontograma da aba Prontuário: tratamentos com dente (avulso **e** orçamento aprovado).
 * Ativo → amarelo; finalizado → verde. Sem tratamento no dente → cor padrão.
 * Com vários tratamentos no mesmo dente, prevalece o **mais recente**
 * (`finalizedAt` se finalizado; senão `updatedAt`/`createdAt`).
 */
export function partitionPatientTreatmentTeeth(treatments: readonly PatientTreatment[]): {
  openToothNumbers: number[];
  finalizedToothNumbers: number[];
} {
  const latestByTooth = new Map<
    number,
    { status: PatientTreatment['status']; activityTime: number }
  >();

  for (const treatment of treatments) {
    const tooth = treatment.toothNumber;
    if (tooth == null || tooth <= 0) continue;
    if (treatment.status !== 'active' && treatment.status !== 'finalized') continue;

    const activityTime = getPatientTreatmentOdontogramActivityTime(treatment);
    const current = latestByTooth.get(tooth);
    if (!current || activityTime >= current.activityTime) {
      latestByTooth.set(tooth, { status: treatment.status, activityTime });
    }
  }

  const open: number[] = [];
  const finalized: number[] = [];

  for (const [tooth, entry] of latestByTooth) {
    if (entry.status === 'active') {
      open.push(tooth);
    } else {
      finalized.push(tooth);
    }
  }

  return {
    openToothNumbers: open.sort((a, b) => a - b),
    finalizedToothNumbers: finalized.sort((a, b) => a - b),
  };
}

/**
 * Mapa anatômico da aba Prontuário: regiões corporais com tratamento ativo ou finalizado.
 *
 * Pacote de sessões (`sessionTotal ≥ 2`): a região só fica **finalizada (verde)** quando
 * **todas** as sessões do pacote estão finalizadas; enquanto houver sessão ativa, permanece
 * **aberta (amarela)**. Tratamentos sem pacote (1 sessão / null) seguem o status individual.
 *
 * Se a região tiver vários pacotes/itens: qualquer unidade ainda ativa → aberta; só fica
 * finalizada quando todas as unidades relevantes estiverem finalizadas.
 */
export function partitionPatientTreatmentBodyRegions(treatments: readonly PatientTreatment[]): {
  openRegionIds: string[];
  finalizedRegionIds: string[];
} {
  type UnitState = { hasActive: boolean; hasFinalized: boolean };

  const unitsByRegion = new Map<string, Map<string, UnitState>>();

  for (const treatment of treatments) {
    if (treatment.locationType !== 'body_region') continue;
    const regionId = parseBodyRegionIdFromLabel(treatment.locationLabel);
    if (!regionId) continue;
    if (treatment.status !== 'active' && treatment.status !== 'finalized') continue;

    const unitKey = bodyRegionTreatmentUnitKey(treatment);
    let regionUnits = unitsByRegion.get(regionId);
    if (!regionUnits) {
      regionUnits = new Map();
      unitsByRegion.set(regionId, regionUnits);
    }

    const current = regionUnits.get(unitKey) ?? { hasActive: false, hasFinalized: false };
    regionUnits.set(unitKey, {
      hasActive: current.hasActive || treatment.status === 'active',
      hasFinalized: current.hasFinalized || treatment.status === 'finalized',
    });
  }

  const open: string[] = [];
  const finalized: string[] = [];

  for (const [regionId, units] of unitsByRegion) {
    let anyActive = false;
    let anyFinalizedUnit = false;

    for (const unit of units.values()) {
      if (unit.hasActive) {
        anyActive = true;
      } else if (unit.hasFinalized) {
        anyFinalizedUnit = true;
      }
    }

    if (anyActive) {
      open.push(regionId);
    } else if (anyFinalizedUnit) {
      finalized.push(regionId);
    }
  }

  return {
    openRegionIds: open.sort((a, b) => a.localeCompare(b, 'pt-BR')),
    finalizedRegionIds: finalized.sort((a, b) => a.localeCompare(b, 'pt-BR')),
  };
}

/** Agrupa itens do mesmo pacote de sessões; demais tratamentos são unidades isoladas. */
function bodyRegionTreatmentUnitKey(treatment: PatientTreatment): string {
  const total = treatment.sessionTotal;
  if (typeof total === 'number' && total >= 2) {
    const budgetPart = treatment.budgetId?.trim() || '_';
    const treatmentPart =
      treatment.treatmentId?.trim() || treatment.treatmentName?.trim() || '_';
    const locationPart = treatment.locationLabel?.trim() || '_';
    return `session:${budgetPart}|${treatmentPart}|${locationPart}|${total}`;
  }
  return `item:${treatment.id}`;
}
