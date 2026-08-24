import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Organization } from '../entities/organization.entity';
import { OrganizationZodValidator } from '../validators/organization.zod.validator';

export class OrganizationValidatorFactory {
  public static create(): Validator<Organization> {
    return OrganizationZodValidator.create();
  }
}
