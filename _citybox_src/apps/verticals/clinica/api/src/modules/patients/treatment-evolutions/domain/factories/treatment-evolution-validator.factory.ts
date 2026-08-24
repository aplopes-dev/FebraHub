import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { TreatmentEvolution } from '../entities/treatment-evolution.entity';
import { TreatmentEvolutionZodValidator } from '../validators/treatment-evolution.zod.validator';

export class TreatmentEvolutionValidatorFactory {
  public static create(): Validator<TreatmentEvolution> {
    return TreatmentEvolutionZodValidator.create();
  }
}
