import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { StoreSettingsProps } from '../entities/store-settings.entity';
import { StoreSettingsZodValidator } from '../validators/store-settings.zod.validator';

export class StoreSettingsValidatorFactory {
  static create(): Validator<StoreSettingsProps> {
    return new StoreSettingsZodValidator();
  }
}
