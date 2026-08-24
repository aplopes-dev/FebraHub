import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { AppointmentProps } from '../entities/appointment.entity';
import { AppointmentZodValidator } from '../validators/appointment.zod.validator';

export class AppointmentValidatorFactory {
  static create(): Validator<AppointmentProps> {
    return new AppointmentZodValidator();
  }
}
