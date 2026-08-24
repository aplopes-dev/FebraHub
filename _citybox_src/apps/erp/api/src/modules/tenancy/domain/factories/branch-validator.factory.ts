import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Branch } from '../entities/branch.entity';
import { BranchZodValidator } from '../validators/branch.zod.validator';

export class BranchValidatorFactory {
  public static create(): Validator<Branch> {
    return BranchZodValidator.create();
  }
}
