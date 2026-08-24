import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { PatientTreatment } from '../entities/patient-treatment.entity';
import { PatientTreatmentZodValidator } from '../validators/patient-treatment.zod.validator';

export class PatientTreatmentValidatorFactory {
  public static create(): Validator<PatientTreatment> {
    return PatientTreatmentZodValidator.create();
  }
}
