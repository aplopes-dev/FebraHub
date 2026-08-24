import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ClinicStoreProfile } from '../entities/clinic-store-profile.entity';
import { ClinicStoreProfileZodValidator } from '../validators/clinic-store-profile.zod.validator';

export class ClinicStoreProfileValidatorFactory {
  public static create(): Validator<ClinicStoreProfile> {
    return ClinicStoreProfileZodValidator.create();
  }
}
