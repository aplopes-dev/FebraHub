import { z } from 'zod';

import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

import type { StockSupplier } from '../entities/stock-supplier.entity';

const supplierSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class StockSupplierZodValidator implements Validator<StockSupplier> {
  private constructor() {}

  public static create(): StockSupplierZodValidator {
    return new StockSupplierZodValidator();
  }

  public validate(input: StockSupplier): void {
    try {
      supplierSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        phone: input.props.phone,
        email: input.props.email,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating StockSupplier ${input.id}: ${msg}`,
          externalMessage: msg,
          context: StockSupplierZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating StockSupplier: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o fornecedor',
        context: StockSupplierZodValidator.name,
      });
    }
  }
}
