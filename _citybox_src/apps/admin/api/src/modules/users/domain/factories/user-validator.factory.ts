import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { User } from '../entities/user.entity';
import { UserZodValidator } from '../validators/user.zod.validator';

export class UserValidatorFactory {
  public static create(): Validator<User> {
    return UserZodValidator.create();
  }
}
