import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { PosPolicy } from '../entities/pos-policy.entity';
import { PosPolicyZodValidator } from '../validators/pos-policy.zod.validator';

export class PosPolicyValidatorFactory {
  public static create(): Validator<PosPolicy> {
    return PosPolicyZodValidator.create();
  }
}
