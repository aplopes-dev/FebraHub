import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { AppointmentCategoryProps } from '../entities/appointment-category.entity';
import { AppointmentCategoryZodValidator } from '../validators/appointment-category.zod.validator';

export class AppointmentCategoryValidatorFactory {
  static create(): Validator<AppointmentCategoryProps> {
    return new AppointmentCategoryZodValidator();
  }
}
