import type {
  PatientTreatmentEvolution,
  PatientTreatmentEvolutionHistoryAction,
  PatientTreatmentEvolutionHistoryEntry,
} from '../types/patient-treatment';
import { getPatientInitials } from './patient-utils';

export function formatEvolutionHistoryDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

export function getEvolutionHistoryActionLabel(
  action: PatientTreatmentEvolutionHistoryAction,
): string {
  switch (action) {
    case 'created':
      return 'Criou esta evolução';
    case 'edited':
      return 'Editou esta evolução';
    default:
      return 'Atualizou esta evolução';
  }
}

export function createEvolutionHistoryEntry(input: {
  professionalId?: string;
  professionalName: string;
  action: PatientTreatmentEvolutionHistoryAction;
  occurredAt?: string;
}): PatientTreatmentEvolutionHistoryEntry {
  return {
    id: crypto.randomUUID(),
    professionalId: input.professionalId,
    professionalName: input.professionalName,
    action: input.action,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export function buildEvolutionCreationHistory(input: {
  professionalId?: string;
  professionalName: string;
  occurredAt?: string;
}): PatientTreatmentEvolutionHistoryEntry[] {
  return [
    createEvolutionHistoryEntry({
      professionalId: input.professionalId,
      professionalName: input.professionalName,
      action: 'created',
      occurredAt: input.occurredAt,
    }),
  ];
}

export function resolveEvolutionActionHistory(
  evolution: PatientTreatmentEvolution,
): PatientTreatmentEvolutionHistoryEntry[] {
  if (evolution.actionHistory?.length) {
    return [...evolution.actionHistory].sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
  }

  return [
    {
      id: `${evolution.id}-created`,
      professionalId: evolution.professionalId,
      professionalName: evolution.professionalName ?? 'Profissional',
      action: 'created',
      occurredAt: evolution.finalizedAt,
    },
  ];
}

export function getEvolutionHistoryProfessionalInitials(professionalName: string): string {
  return getPatientInitials(professionalName);
}

export function formatEvolutionHistoryEntryDescription(
  entry: PatientTreatmentEvolutionHistoryEntry,
): string {
  return `${getEvolutionHistoryActionLabel(entry.action)} em ${formatEvolutionHistoryDateTime(entry.occurredAt)}`;
}

export function materializeEvolutionActionHistory(
  evolution: PatientTreatmentEvolution,
): PatientTreatmentEvolutionHistoryEntry[] {
  return evolution.actionHistory?.length
    ? [...evolution.actionHistory]
    : resolveEvolutionActionHistory(evolution);
}

export function appendEvolutionEditedHistory(
  evolution: PatientTreatmentEvolution,
  editor: { professionalId: string; professionalName: string },
): PatientTreatmentEvolutionHistoryEntry[] {
  const editedEntry = createEvolutionHistoryEntry({
    professionalId: editor.professionalId,
    professionalName: editor.professionalName,
    action: 'edited',
  });

  return [editedEntry, ...materializeEvolutionActionHistory(evolution)];
}
