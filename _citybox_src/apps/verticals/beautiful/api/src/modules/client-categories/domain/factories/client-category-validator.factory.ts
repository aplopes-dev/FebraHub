import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ClientCategoryProps } from '../entities/client-category.entity';
import { ClientCategoryZodValidator } from '../validators/client-category.zod.validator';

export class ClientCategoryValidatorFactory {
  static create(): Validator<ClientCategoryProps> {
    return new ClientCategoryZodValidator();
  }
}
