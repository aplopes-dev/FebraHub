import type { TreatmentEvolution } from '../entities/treatment-evolution.entity';
import type { EvolutionHistory } from '../entities/evolution-history.entity';

export abstract class TreatmentEvolutionRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<TreatmentEvolution | null>;

  abstract findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<TreatmentEvolution[]>;

  abstract findByIds(
    storeId: string,
    patientId: string,
    ids: string[],
  ): Promise<TreatmentEvolution[]>;

  abstract save(evolution: TreatmentEvolution): Promise<TreatmentEvolution>;

  abstract delete(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<void>;

  abstract appendHistory(entry: EvolutionHistory): Promise<EvolutionHistory>;

  abstract findHistoryByEvolutionId(
    storeId: string,
    evolutionId: string,
  ): Promise<EvolutionHistory[]>;
}
