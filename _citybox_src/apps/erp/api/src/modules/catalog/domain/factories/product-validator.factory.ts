import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Product } from '../entities/product.entity';
import { ProductZodValidator } from '../validators/product.zod.validator';

export class ProductValidatorFactory {
  public static create(): Validator<Product> {
    return ProductZodValidator.create();
  }
}
