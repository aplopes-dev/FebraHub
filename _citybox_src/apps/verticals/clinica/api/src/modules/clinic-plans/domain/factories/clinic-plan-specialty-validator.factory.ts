import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ClinicPlanSpecialty } from '../entities/clinic-plan-specialty.entity';
import { ClinicPlanSpecialtyZodValidator } from '../validators/clinic-plan-specialty.zod.validator';

export class ClinicPlanSpecialtyValidatorFactory {
  public static create(): Validator<ClinicPlanSpecialty> {
    return ClinicPlanSpecialtyZodValidator.create();
  }
}
