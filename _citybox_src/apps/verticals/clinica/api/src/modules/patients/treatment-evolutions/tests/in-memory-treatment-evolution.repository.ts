import { TreatmentEvolutionRepository } from '../domain/repositories/treatment-evolution.repository.interface';
import {
  TreatmentEvolution,
  type TreatmentEvolutionProps,
} from '../domain/entities/treatment-evolution.entity';
import {
  EvolutionHistory,
  type EvolutionHistoryProps,
} from '../domain/entities/evolution-history.entity';

export class InMemoryTreatmentEvolutionRepository extends TreatmentEvolutionRepository {
  private readonly evolutions = new Map<string, TreatmentEvolution>();
  private readonly history = new Map<string, EvolutionHistory>();

  async findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<TreatmentEvolution | null> {
    const evolution = this.evolutions.get(id);
    if (
      !evolution ||
      evolution.storeId !== storeId ||
      evolution.patientId !== patientId
    ) {
      return null;
    }
    return evolution;
  }

  async findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<TreatmentEvolution[]> {
    return [...this.evolutions.values()].filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );
  }

  async findByIds(
    storeId: string,
    patientId: string,
    ids: string[],
  ): Promise<TreatmentEvolution[]> {
    const idSet = new Set(ids);
    return [...this.evolutions.values()].filter(
      (item) =>
        item.storeId === storeId &&
        item.patientId === patientId &&
        idSet.has(item.id),
    );
  }

  async save(evolution: TreatmentEvolution): Promise<TreatmentEvolution> {
    this.evolutions.set(evolution.id, evolution);
    return evolution;
  }

  async delete(storeId: string, patientId: string, id: string): Promise<void> {
    const evolution = await this.findById(storeId, patientId, id);
    if (evolution) {
      this.evolutions.delete(id);
      for (const entry of [...this.history.values()]) {
        if (entry.evolutionId === id) {
          this.history.delete(entry.id);
        }
      }
    }
  }

  async appendHistory(entry: EvolutionHistory): Promise<EvolutionHistory> {
    this.history.set(entry.id, entry);
    return entry;
  }

  async findHistoryByEvolutionId(
    storeId: string,
    evolutionId: string,
  ): Promise<EvolutionHistory[]> {
    return [...this.history.values()].filter(
      (entry) => entry.storeId === storeId && entry.evolutionId === evolutionId,
    );
  }

  seedEvolution(
    props: Omit<
      TreatmentEvolutionProps,
      | 'createdAt'
      | 'updatedAt'
      | 'treatmentId'
      | 'description'
      | 'valueCents'
      | 'evolutionNotes'
      | 'professionalId'
      | 'professionalName'
      | 'soapSubjective'
      | 'soapObjective'
      | 'soapAssessment'
      | 'soapPlan'
      | 'cid10Codes'
      | 'confirmedAt'
      | 'confirmedBy'
      | 'confirmationHash'
      | 'signatureStatus'
      | 'signatureRequestId'
    > &
      Partial<
        Pick<
          TreatmentEvolutionProps,
          | 'treatmentId'
          | 'description'
          | 'valueCents'
          | 'evolutionNotes'
          | 'professionalId'
          | 'professionalName'
          | 'confirmedAt'
          | 'confirmedBy'
          | 'confirmationHash'
          | 'signatureStatus'
          | 'signatureRequestId'
        >
      >,
    id?: string,
  ): TreatmentEvolution {
    const evolution = TreatmentEvolution.create(props, id);
    this.evolutions.set(evolution.id, evolution);
    return evolution;
  }

  seedHistory(
    props: Omit<
      EvolutionHistoryProps,
      'createdAt' | 'professionalId' | 'professionalName'
    > &
      Partial<
        Pick<EvolutionHistoryProps, 'professionalId' | 'professionalName'>
      >,
    id?: string,
  ): EvolutionHistory {
    const entry = EvolutionHistory.create(props, id);
    this.history.set(entry.id, entry);
    return entry;
  }
}
