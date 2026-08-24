import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

import type { SalesLabel } from '../entities/sales-label.entity';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const labelSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  name: z.string().min(1).max(80),
  color: z.string().regex(HEX_COLOR, 'Cor deve ser hex (#RRGGBB)'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class SalesLabelZodValidator implements Validator<SalesLabel> {
  private constructor() {}

  public static create(): SalesLabelZodValidator {
    return new SalesLabelZodValidator();
  }

  public validate(input: SalesLabel): void {
    try {
      labelSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        color: input.props.color,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating SalesLabel ${input.id}: ${msg}`,
          externalMessage: msg,
          context: SalesLabelZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating SalesLabel: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o rótulo',
        context: SalesLabelZodValidator.name,
      });
    }
  }
}
