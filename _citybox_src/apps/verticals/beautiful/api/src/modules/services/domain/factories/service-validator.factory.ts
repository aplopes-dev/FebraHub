import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ServiceProps } from '../entities/service.entity';
import { ServiceZodValidator } from '../validators/service.zod.validator';

export class ServiceValidatorFactory {
  static create(): Validator<ServiceProps> {
    return new ServiceZodValidator();
  }
}
