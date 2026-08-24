import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ProductProps } from '../entities/product.entity';
import { ProductZodValidator } from '../validators/product.zod.validator';

export class ProductValidatorFactory {
  static create(): Validator<ProductProps> {
    return new ProductZodValidator();
  }
}
