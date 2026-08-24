import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Plan } from '../entities/plan.entity';
import { PlanZodValidator } from '../validators/plan.zod.validator';

export class PlanValidatorFactory {
  public static create(): Validator<Plan> {
    return PlanZodValidator.create();
  }
}
