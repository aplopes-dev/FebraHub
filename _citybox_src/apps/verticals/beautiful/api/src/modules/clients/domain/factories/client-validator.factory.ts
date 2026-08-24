import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ClientProps } from '../entities/client.entity';
import { ClientZodValidator } from '../validators/client.zod.validator';

export class ClientValidatorFactory {
  static create(): Validator<ClientProps> {
    return new ClientZodValidator();
  }
}
