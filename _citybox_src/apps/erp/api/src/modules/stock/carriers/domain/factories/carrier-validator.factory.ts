import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { Carrier } from '../entities/carrier.entity';
import { CarrierZodValidator } from '../validators/carrier.zod.validator';

export class CarrierValidatorFactory {
  public static create(): Validator<Carrier> {
    return CarrierZodValidator.create();
  }
}
