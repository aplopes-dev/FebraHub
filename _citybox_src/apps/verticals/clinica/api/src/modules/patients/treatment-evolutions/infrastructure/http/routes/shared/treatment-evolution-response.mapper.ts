import type { TreatmentEvolution } from '../../../../domain/entities/treatment-evolution.entity';
import type { EvolutionHistory } from '../../../../domain/entities/evolution-history.entity';

export function toTreatmentEvolutionResponse(evolution: TreatmentEvolution) {
  return {
    id: evolution.id,
    patientId: evolution.patientId,
    treatmentId: evolution.treatmentId,
    source: evolution.source,
    description: evolution.description,
    valueCents: evolution.valueCents,
    evolutionNotes: evolution.evolutionNotes,
    professionalId: evolution.professionalId,
    professionalName: evolution.professionalName,
    finalizedAt: evolution.finalizedAt.toISOString(),
    confirmedAt: evolution.confirmedAt?.toISOString() ?? null,
    confirmedBy: evolution.confirmedBy,
    confirmationHash: evolution.confirmationHash,
    signatureStatus: evolution.signatureStatus,
    signatureRequestId: evolution.signatureRequestId,
    createdAt: evolution.createdAt.toISOString(),
    updatedAt: evolution.updatedAt.toISOString(),
  };
}

export function toEvolutionHistoryResponse(entry: EvolutionHistory) {
  return {
    id: entry.id,
    evolutionId: entry.evolutionId,
    action: entry.action,
    professionalId: entry.professionalId,
    professionalName: entry.professionalName,
    occurredAt: entry.occurredAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  };
}
