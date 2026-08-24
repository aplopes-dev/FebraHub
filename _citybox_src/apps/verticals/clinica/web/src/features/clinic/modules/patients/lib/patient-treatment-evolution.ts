import type {
  PatientStandaloneEvolutionFormValues,
  PatientStandaloneEvolutionPayload,
  PatientTreatment,
  PatientTreatmentEvolution,
} from '../types/patient-treatment';
import {
  appendEvolutionEditedHistory,
  buildEvolutionCreationHistory,
} from './patient-treatment-evolution-history';
import {
  formatPatientTreatmentLabel,
  formatPatientTreatmentFinalizedDate,
} from './patient-treatment-ui';

export type CreateTreatmentEvolutionInput = {
  finalizedAt: string;
  professionalId: string;
  professionalName: string;
  evolutionNotes: string;
};

export type CreateStandaloneEvolutionInput = CreateTreatmentEvolutionInput;

export const STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION = 'Evolução avulsa';

export function toPatientTreatmentFinalizedAt(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized.toISOString();
}

/**
 * O card da evolução nutricional mostra a hora, mas o formulário só pede a data:
 * a hora vem do instante do salvamento. Fixar meio-dia como nas demais vertentes
 * faria todo atendimento aparecer às 12:00.
 */
export function toPatientNutritionInitiatedAt(
  date: Date,
  now: Date = new Date(),
): string {
  const normalized = new Date(date);
  normalized.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  return normalized.toISOString();
}

export function createTreatmentEvolution(
  treatment: PatientTreatment,
  input: CreateTreatmentEvolutionInput,
): PatientTreatmentEvolution {
  const occurredAt = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    treatmentId: treatment.id,
    patientId: treatment.patientId,
    source: treatment.source,
    description: formatPatientTreatmentLabel(treatment),
    valueCents: treatment.valueCents,
    finalizedAt: input.finalizedAt,
    professionalId: input.professionalId,
    professionalName: input.professionalName,
    evolutionNotes: input.evolutionNotes.trim(),
    signatureStatus: 'unsigned',
    actionHistory: buildEvolutionCreationHistory({
      professionalId: input.professionalId,
      professionalName: input.professionalName,
      occurredAt,
    }),
  };
}

export function createStandaloneEvolution(
  patientId: string,
  input: CreateStandaloneEvolutionInput,
): PatientTreatmentEvolution {
  const id = crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  return {
    id,
    treatmentId: `standalone-evolution-${id}`,
    patientId,
    source: 'standalone',
    description: STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
    valueCents: 0,
    finalizedAt: input.finalizedAt,
    professionalId: input.professionalId,
    professionalName: input.professionalName,
    evolutionNotes: input.evolutionNotes.trim(),
    signatureStatus: 'unsigned',
    actionHistory: buildEvolutionCreationHistory({
      professionalId: input.professionalId,
      professionalName: input.professionalName,
      occurredAt,
    }),
  };
}

export function mapEvolutionToStandaloneFormValues(
  evolution: PatientTreatmentEvolution,
): PatientStandaloneEvolutionFormValues {
  return {
    professionalId: evolution.professionalId ?? '',
    evolutionDate: new Date(evolution.finalizedAt),
    evolutionNotes: evolution.evolutionNotes,
  };
}

export function applyEvolutionUpdate(
  evolution: PatientTreatmentEvolution,
  payload: PatientStandaloneEvolutionPayload,
): PatientTreatmentEvolution {
  return {
    ...evolution,
    professionalId: payload.professionalId,
    professionalName: payload.professionalName,
    finalizedAt: payload.finalizedAt,
    evolutionNotes: payload.evolutionNotes.trim(),
    actionHistory: appendEvolutionEditedHistory(evolution, {
      professionalId: payload.professionalId,
      professionalName: payload.professionalName,
    }),
  };
}

export function sortEvolutionsByDateDesc(
  evolutions: PatientTreatmentEvolution[],
): PatientTreatmentEvolution[] {
  return [...evolutions].sort(
    (left, right) =>
      new Date(right.finalizedAt).getTime() - new Date(left.finalizedAt).getTime(),
  );
}

export type PatientTreatmentEvolutionDateGroup = {
  dateKey: string;
  dateLabel: string;
  items: PatientTreatmentEvolution[];
};

function getEvolutionDateKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function groupEvolutionsByDate(
  evolutions: PatientTreatmentEvolution[],
): PatientTreatmentEvolutionDateGroup[] {
  const sorted = sortEvolutionsByDateDesc(evolutions);
  const groups: PatientTreatmentEvolutionDateGroup[] = [];

  for (const evolution of sorted) {
    const dateKey = getEvolutionDateKey(evolution.finalizedAt);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.dateKey === dateKey) {
      groups[groups.length - 1] = {
        ...lastGroup,
        items: [...lastGroup.items, evolution],
      };
      continue;
    }

    groups.push({
      dateKey,
      dateLabel: formatPatientTreatmentFinalizedDate(evolution.finalizedAt),
      items: [evolution],
    });
  }

  return groups;
}
