import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ClinicPlan } from '../entities/clinic-plan.entity';

export class ClinicPlanZodValidator implements Validator<ClinicPlan> {
  private constructor() {}

  public static create(): ClinicPlanZodValidator {
    return new ClinicPlanZodValidator();
  }

  public validate(input: ClinicPlan): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        sortOrder: input.props.sortOrder,
        status: input.props.status,
        isDefault: input.props.isDefault,
        treatmentInit: input.props.treatmentInit,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating ClinicPlan ${input.id}: ${msg}`,
          externalMessage: msg,
          context: ClinicPlanZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ClinicPlan: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o plano',
        context: ClinicPlanZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z
      .object({
        id: z.string().uuid(),
        storeId: z.string().min(1),
        name: z.string().min(1).max(200),
        sortOrder: z.number().int().min(1),
        status: z.enum(['active', 'inactive']),
        isDefault: z.boolean(),
        treatmentInit: z.enum(['copy_default', 'empty']).nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
      .refine((data) => !data.isDefault || data.status === 'active', {
        message: 'Plano padrão deve estar ativo',
        path: ['isDefault'],
      });
  }
}
