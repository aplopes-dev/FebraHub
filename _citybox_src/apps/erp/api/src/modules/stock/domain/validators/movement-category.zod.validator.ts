import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  MOVEMENT_CATEGORY_TYPES,
  type MovementCategory,
} from '../entities/movement-category.entity';

export class MovementCategoryZodValidator implements Validator<MovementCategory> {
  private constructor() {}

  public static create(): MovementCategoryZodValidator {
    return new MovementCategoryZodValidator();
  }

  public validate(input: MovementCategory): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating MovementCategory ${input.props.name}: ${message}`,
          externalMessage: message,
          context: MovementCategoryZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating MovementCategory: ${err.message}`,
        externalMessage:
          'Houve um erro ao validar os dados da categoria de movimentação',
        context: MovementCategoryZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().uuid(),
      code: z
        .string()
        .trim()
        .regex(/^CM-\d{3,}$/i, 'Código inválido (ex.: CM-001)'),
      name: z.string().trim().min(1).max(60),
      type: z.enum(MOVEMENT_CATEGORY_TYPES),
      systemKey: z.string().trim().min(1).max(60).nullable(),
      isSystem: z.boolean(),
      branchIds: z
        .array(z.string().uuid())
        .min(1, 'Informe ao menos uma unidade'),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
