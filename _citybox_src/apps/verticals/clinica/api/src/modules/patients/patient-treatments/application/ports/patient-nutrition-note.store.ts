import type { PatientNutritionNoteResult } from '../../domain/types/patient-nutrition-note';

export abstract class PatientNutritionNoteStore {
  abstract save(
    note: PatientNutritionNoteResult,
  ): Promise<PatientNutritionNoteResult>;

  abstract findById(
    storeId: string,
    patientId: string,
    noteId: string,
  ): Promise<PatientNutritionNoteResult | null>;

  /** Ordem cronológica: a nota mais recente fica no fim da lista. */
  abstract listByEvolution(
    storeId: string,
    patientId: string,
    evolutionId: string,
  ): Promise<PatientNutritionNoteResult[]>;
}
