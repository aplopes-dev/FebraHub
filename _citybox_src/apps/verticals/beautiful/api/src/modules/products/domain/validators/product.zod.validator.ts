import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ProductProps } from '../entities/product.entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

export class ProductZodValidator implements Validator<ProductProps> {
  private schema = z.object({
    storeId: z.uuid(),
    name: z
      .string()
      .min(2, 'O nome do produto deve ter no mínimo 2 caracteres'),
    sku: z.string().nullable().optional(),
    unitOfMeasure: z.string().min(1, 'A unidade de medida é obrigatória'),
    stockQuantity: z
      .number()
      .min(0, 'A quantidade em estoque não pode ser negativa'),
    minStockQuantity: z
      .number()
      .min(0, 'O estoque mínimo não pode ser negativo'),
    costPrice: z
      .number()
      .positive('O custo unitário deve ser maior que zero')
      .nullable()
      .optional(),
    description: z.string().nullable().optional(),
    active: z.boolean(),
  });

  validate(input: ProductProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `Product validation failed: ${message}`,
        externalMessage: message,
        context: 'ProductValidator',
      });
    }
  }
}
