import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ContractModel } from '../entities/contract-model.entity';
import { ContractModelZodValidator } from '../validators/contract-model.zod.validator';

export class ContractModelValidatorFactory {
  public static create(): Validator<ContractModel> {
    return ContractModelZodValidator.create();
  }
}
