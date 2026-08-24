import type {
  NutritionInitSectionPayload,
  PatientNutritionInitiationResult,
  PatientNutritionInitiationSummary,
} from '../../domain/types/patient-nutrition-initiation';
import type { TreatmentEvolution } from '../../../treatment-evolutions/domain/entities/treatment-evolution.entity';
import type { EvolutionHistory } from '../../../treatment-evolutions/domain/entities/evolution-history.entity';
import type { PatientAnamnesis } from '../../../patient-anamneses/domain/entities/patient-anamnesis.entity';

export type SavePatientNutritionInitiationInput = {
  initiation: PatientNutritionInitiationResult;
  evolution: TreatmentEvolution;
  history: EvolutionHistory;
  patientAnamnesis?: PatientAnamnesis;
};

export abstract class PatientNutritionInitiationStore {
  abstract save(
    input: SavePatientNutritionInitiationInput,
  ): Promise<PatientNutritionInitiationResult>;

  abstract findByEvolutionId(
    storeId: string,
    patientId: string,
    evolutionId: string,
  ): Promise<PatientNutritionInitiationResult | null>;

  abstract findSummariesByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientNutritionInitiationSummary[]>;
}

export type { NutritionInitSectionPayload };
