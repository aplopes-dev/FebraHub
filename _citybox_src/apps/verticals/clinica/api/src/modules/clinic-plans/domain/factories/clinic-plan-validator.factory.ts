import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ClinicPlan } from '../entities/clinic-plan.entity';
import { ClinicPlanZodValidator } from '../validators/clinic-plan.zod.validator';

export class ClinicPlanValidatorFactory {
  public static create(): Validator<ClinicPlan> {
    return ClinicPlanZodValidator.create();
  }
}
