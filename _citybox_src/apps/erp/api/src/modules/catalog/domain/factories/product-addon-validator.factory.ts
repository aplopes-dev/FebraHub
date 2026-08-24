import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { ProductAddon } from '../entities/product-addon.entity';
import { ProductAddonZodValidator } from '../validators/product-addon.zod.validator';

export class ProductAddonValidatorFactory {
  public static create(): Validator<ProductAddon> {
    return ProductAddonZodValidator.create();
  }
}
