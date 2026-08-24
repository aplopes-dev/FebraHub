import type { PatientTreatment, PatientTreatmentEvolution, PatientTreatmentEvolutionHistoryEntry, PatientTreatmentSource, PatientTreatmentStatus } from '../types/patient-treatment';
import type {
  PatientTreatmentApiItem,
  PatientTreatmentApiLocationType,
  PatientTreatmentApiStatus,
  PatientTreatmentCreateBody,
  PatientTreatmentFinalizeBody,
  PatientTreatmentUpdateBody,
  TreatmentEvolutionApiItem,
  TreatmentEvolutionApiSource,
  TreatmentEvolutionCreateBody,
  TreatmentEvolutionHistoryApiItem,
  TreatmentEvolutionUpdateBody,
} from '../types/patient-treatment-api';
import type { PatientStandaloneEvolutionPayload, PatientStandaloneTreatmentDraft } from '../types/patient-treatment';
import type { PatientTreatmentFinalizePayload } from '../types/patient-treatment';
import { parseBrlCurrencyToCents } from './patient-budget-form-utils';
import { parseToothLocationLabel } from './tooth-location-label';

function parseToothNumber(locationType: string, locationLabel: string): number | undefined {
  if (locationType !== 'tooth' || !locationLabel.trim()) {
    return undefined;
  }

  const parsed = parseToothLocationLabel(locationLabel);
  if (parsed) {
    return parsed.toothNumber;
  }

  const fallback = Number.parseInt(locationLabel, 10);
  return Number.isNaN(fallback) ? undefined : fallback;
}

export function mapApiTreatmentStatusToUi(status: PatientTreatmentApiStatus): PatientTreatmentStatus {
  return status === 'completed' ? 'finalized' : 'active';
}

export function mapApiTreatmentSourceToUi(source: PatientTreatmentApiItem['source']): PatientTreatmentSource {
  return source;
}

export function mapApiEvolutionSourceToUi(source: TreatmentEvolutionApiSource): PatientTreatmentSource {
  return source === 'standalone' ? 'standalone' : 'standalone';
}

export function toPatientTreatment(item: PatientTreatmentApiItem): PatientTreatment {
  const toothNumber = parseToothNumber(item.locationType, item.locationLabel);

  return {
    id: item.id,
    patientId: item.patientId,
    source: mapApiTreatmentSourceToUi(item.source),
    status: mapApiTreatmentStatusToUi(item.status),
    description: item.description || item.treatmentName,
    valueCents: item.valueCents,
    budgetId: item.budgetId ?? undefined,
    treatmentItemId: item.budgetItemId ?? undefined,
    toothNumber,
    locationType: item.locationType,
    locationLabel: item.locationLabel,
    sessionIndex: item.sessionIndex ?? null,
    sessionTotal: item.sessionTotal ?? null,
    treatmentId: item.treatmentId ?? undefined,
    treatmentName: item.treatmentName,
    planId: item.planId ?? undefined,
    planName: item.planName,
    professionalId: item.professionalId ?? undefined,
    professionalName: item.professionalName,
    finalizedAt: item.finalizedAt ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    diagnosis: item.diagnosis,
    observation: item.observation,
  };
}

export function toStandaloneTreatmentCreateBody(
  draft: PatientStandaloneTreatmentDraft,
  location: { type: PatientTreatmentApiLocationType; label: string },
  professionalName: string,
): PatientTreatmentCreateBody {
  return {
    planId: draft.planId,
    treatmentId: draft.treatmentId,
    professionalId: draft.professionalId,
    professionalName,
    valueCents: parseBrlCurrencyToCents(draft.value),
    locationType: location.type,
    locationLabel: location.label,
  };
}

export function toPatientTreatmentUpdateBody(
  values: { diagnosis: string; observation: string },
): PatientTreatmentUpdateBody {
  return {
    diagnosis: values.diagnosis,
    observation: values.observation,
  };
}

export function toPatientTreatmentFinalizeBody(
  payload: PatientTreatmentFinalizePayload,
): PatientTreatmentFinalizeBody {
  return {
    treatmentIds: payload.treatmentIds,
    professionalId: payload.professionalId,
    professionalName: payload.professionalName,
    finalizedAt: payload.finalizedAt,
    evolutionNotes: payload.evolutionNotes,
  };
}

export function toTreatmentEvolution(item: TreatmentEvolutionApiItem): PatientTreatmentEvolution {
  return {
    id: item.id,
    treatmentId: item.treatmentId ?? `standalone-evolution-${item.id}`,
    patientId: item.patientId,
    source: mapApiEvolutionSourceToUi(item.source),
    apiSource: item.source,
    description: item.description,
    valueCents: item.valueCents ?? 0,
    finalizedAt: item.finalizedAt,
    professionalId: item.professionalId ?? undefined,
    professionalName: item.professionalName,
    evolutionNotes: item.evolutionNotes,
    signatureStatus: item.signatureStatus ?? 'unsigned',
    signatureRequestId: item.signatureRequestId ?? undefined,
  };
}

export function toEvolutionHistoryEntry(
  item: TreatmentEvolutionHistoryApiItem,
): PatientTreatmentEvolutionHistoryEntry {
  const action =
    item.action === 'confirmed' ? 'edited' : item.action;

  return {
    id: item.id,
    professionalId: item.professionalId ?? undefined,
    professionalName: item.professionalName,
    action,
    occurredAt: item.occurredAt,
  };
}

export function toStandaloneEvolutionCreateBody(
  payload: PatientStandaloneEvolutionPayload,
): TreatmentEvolutionCreateBody {
  return {
    professionalId: payload.professionalId,
    professionalName: payload.professionalName,
    finalizedAt: payload.finalizedAt,
    evolutionNotes: payload.evolutionNotes,
  };
}

export function toStandaloneEvolutionUpdateBody(
  payload: PatientStandaloneEvolutionPayload,
): TreatmentEvolutionUpdateBody {
  return toStandaloneEvolutionCreateBody(payload);
}
