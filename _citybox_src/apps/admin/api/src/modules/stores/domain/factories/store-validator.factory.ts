import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Store } from '../entities/store.entity';
import { StoreZodValidator } from '../validators/store.zod.validator';

export class StoreValidatorFactory {
  public static create(): Validator<Store> {
    return StoreZodValidator.create();
  }
}
