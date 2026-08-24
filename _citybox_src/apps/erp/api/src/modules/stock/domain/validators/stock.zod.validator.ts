import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  STOCK_LOCATIONS,
  STOCK_PROPERTIES,
  type Stock,
} from '../entities/stock.entity';

export class StockZodValidator implements Validator<Stock> {
  private constructor() {}

  public static create(): StockZodValidator {
    return new StockZodValidator();
  }

  public validate(input: Stock): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Stock ${input.props.name}: ${message}`,
          externalMessage: message,
          context: StockZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Stock: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do estoque',
        context: StockZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
      location: z.enum(STOCK_LOCATIONS),
      property: z.enum(STOCK_PROPERTIES),
      branchIds: z.array(z.string().uuid()),
      isDefault: z.boolean(),
      systemKey: z.string().trim().min(1).max(60).nullable(),
      isSystem: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
