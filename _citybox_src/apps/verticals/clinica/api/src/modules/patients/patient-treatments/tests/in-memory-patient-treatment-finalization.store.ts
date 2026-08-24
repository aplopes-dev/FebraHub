import {
  PatientTreatmentFinalizationStore,
  type PatientTreatmentFinalizationInput,
} from '../application/ports/patient-treatment-finalization.store';
import type { PatientTreatment } from '../domain/entities/patient-treatment.entity';
import type { InMemoryPatientTreatmentRepository } from './in-memory-patient-treatment.repository';
import type { InMemoryTreatmentEvolutionRepository } from '../../treatment-evolutions/tests/in-memory-treatment-evolution.repository';

export class InMemoryPatientTreatmentFinalizationStore extends PatientTreatmentFinalizationStore {
  constructor(
    private readonly treatmentRepository: InMemoryPatientTreatmentRepository,
    private readonly evolutionRepository: InMemoryTreatmentEvolutionRepository,
  ) {
    super();
  }

  async execute(
    input: PatientTreatmentFinalizationInput,
  ): Promise<PatientTreatment[]> {
    await this.evolutionRepository.save(input.evolution);
    await this.evolutionRepository.appendHistory(input.history);
    const saved: PatientTreatment[] = [];
    for (const treatment of input.treatments) {
      saved.push(await this.treatmentRepository.save(treatment));
    }
    return saved;
  }
}
