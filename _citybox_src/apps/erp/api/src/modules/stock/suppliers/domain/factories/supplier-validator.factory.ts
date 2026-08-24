import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { Supplier } from '../entities/supplier.entity';
import { SupplierZodValidator } from '../validators/supplier.zod.validator';

export class SupplierValidatorFactory {
  public static create(): Validator<Supplier> {
    return SupplierZodValidator.create();
  }
}
