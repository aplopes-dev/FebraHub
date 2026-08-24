import type { EvolutionHistory } from '../../../treatment-evolutions/domain/entities/evolution-history.entity';
import type { TreatmentEvolution } from '../../../treatment-evolutions/domain/entities/treatment-evolution.entity';
import type { PatientTreatment } from '../../domain/entities/patient-treatment.entity';

export type PatientTreatmentFinalizationInput = {
  /** Um ou mais procedimentos finalizados na mesma operação. */
  treatments: PatientTreatment[];
  /** Uma única evolução clínica para o lote (ou item único). */
  evolution: TreatmentEvolution;
  history: EvolutionHistory;
};

export abstract class PatientTreatmentFinalizationStore {
  abstract execute(
    input: PatientTreatmentFinalizationInput,
  ): Promise<PatientTreatment[]>;
}
