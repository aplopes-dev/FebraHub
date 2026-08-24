import { z } from 'zod';

import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

import type { StockProduct } from '../entities/stock-product.entity';

const photoOptional = z.string().min(1).max(512).nullable();

export class StockProductZodValidator implements Validator<StockProduct> {
  private constructor() {}

  public static create(): StockProductZodValidator {
    return new StockProductZodValidator();
  }

  public validate(input: StockProduct): void {
    try {
      z.object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        name: z.string().min(1).max(160),
        category: z.string().min(1).max(120),
        sku: z.string().max(80).nullable(),
        supplierId: z.string().uuid().nullable(),
        quantity: z.number().int().min(0),
        minQuantity: z.number().int().min(0),
        unitCostCents: z.number().int().min(0),
        photoObjectKey: photoOptional,
        photoMimeType: z.string().max(64).nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }).parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        category: input.props.category,
        sku: input.props.sku,
        supplierId: input.props.supplierId,
        quantity: input.props.quantity,
        minQuantity: input.props.minQuantity,
        unitCostCents: input.props.unitCostCents,
        photoObjectKey: input.props.photoObjectKey,
        photoMimeType: input.props.photoMimeType,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating StockProduct ${input.id}: ${msg}`,
          externalMessage: msg,
          context: StockProductZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating StockProduct: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o produto do estoque',
        context: StockProductZodValidator.name,
      });
    }
  }
}
