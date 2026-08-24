import { z } from 'zod';

import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

import type { StockMovement } from '../entities/stock-movement.entity';
import type { StockMovementType } from '../stock-types';

const movementSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  productId: z.string().uuid(),
  type: z.union([
    z.literal('entry'),
    z.literal('withdrawal'),
    z.literal('adjustment'),
  ]),
  quantity: z.number().int().min(1),
  notes: z.string().nullable(),
  requestedById: z.string().uuid().nullable(),
  requestedByName: z.string().nullable(),
  authorizedById: z.string().min(1),
  authorizedByName: z.string().min(1),
  createdAt: z.date(),
});

export class StockMovementZodValidator implements Validator<StockMovement> {
  private constructor() {}

  public static create(): StockMovementZodValidator {
    return new StockMovementZodValidator();
  }

  public validate(input: StockMovement): void {
    try {
      movementSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        productId: input.props.productId,
        type: input.props.type,
        quantity: input.props.quantity,
        notes: input.props.notes,
        requestedById: input.props.requestedById,
        requestedByName: input.props.requestedByName,
        authorizedById: input.props.authorizedById,
        authorizedByName: input.props.authorizedByName,
        createdAt: input.props.createdAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating StockMovement ${input.id}: ${msg}`,
          externalMessage: msg,
          context: StockMovementZodValidator.name,
        });
      }

      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating StockMovement: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a movimentação',
        context: StockMovementZodValidator.name,
      });
    }
  }
}
