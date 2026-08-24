import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { MovementCategory } from '../entities/movement-category.entity';
import { MovementCategoryZodValidator } from '../validators/movement-category.zod.validator';

export class MovementCategoryValidatorFactory {
  public static create(): Validator<MovementCategory> {
    return MovementCategoryZodValidator.create();
  }
}
