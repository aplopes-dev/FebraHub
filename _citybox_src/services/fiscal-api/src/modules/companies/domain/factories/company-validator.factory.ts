import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Company } from '../entities/company.entity';
import { CompanyZodValidator } from '../validators/company.zod.validator';

export class CompanyValidatorFactory {
  public static create(): Validator<Company> {
    return CompanyZodValidator.create();
  }
}
