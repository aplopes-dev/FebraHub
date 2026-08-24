import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { PatientCategory } from '../entities/patient-category.entity';

const colorIdSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex #rrggbb');

export class PatientCategoryZodValidator implements Validator<PatientCategory> {
  private constructor() {}

  public static create(): PatientCategoryZodValidator {
    return new PatientCategoryZodValidator();
  }

  public validate(input: PatientCategory): void {
    try {
      z.object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        name: z.string().min(1).max(120),
        colorId: colorIdSchema,
        isProtected: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }).parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        colorId: input.props.colorId,
        isProtected: input.props.isProtected,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PatientCategory ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientCategoryZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientCategory: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a categoria de paciente',
        context: PatientCategoryZodValidator.name,
      });
    }
  }
}
