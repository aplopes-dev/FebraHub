import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ClinicPlanTreatment } from '../entities/clinic-plan-treatment.entity';
import { ClinicPlanTreatmentZodValidator } from '../validators/clinic-plan-treatment.zod.validator';

export class ClinicPlanTreatmentValidatorFactory {
  public static create(): Validator<ClinicPlanTreatment> {
    return ClinicPlanTreatmentZodValidator.create();
  }
}
