import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Customer } from '../entities/customer.entity';
import { CustomerZodValidator } from '../validators/customer.zod.validator';

export class CustomerValidatorFactory {
  public static create(): Validator<Customer> {
    return CustomerZodValidator.create();
  }
}
