import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { Plan } from '../entities/plan.entity';

export class PlanZodValidator implements Validator<Plan> {
  private constructor() {}

  public static create(): PlanZodValidator {
    return new PlanZodValidator();
  }

  public validate(input: Plan): void {
    try {
      this.getSchema().parse({
        id: input.id,
        code: input.props.code,
        name: input.props.name,
        description: input.props.description,
        prices: input.props.prices,
        vertical: input.props.vertical,
        tier: input.props.tier,
        maxStores: input.props.maxStores,
        maxNegocios: input.props.maxNegocios,
        maxUsers: input.props.maxUsers,
        maxProducts: input.props.maxProducts,
        status: input.props.status,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Plan ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PlanZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Plan: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do plano',
        context: PlanZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      code: z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9-]+$/),
      name: z.string().min(1).max(200),
      description: z.string().max(500),
      prices: z.array(
        z.object({
          id: z.string().uuid().optional(),
          stripePriceId: z.string().nullable().optional(),
          cycle: z.enum(['MONTHLY', 'YEARLY']),
          priceCents: z.number().int().min(0),
          status: z.enum(['ACTIVE', 'HIDDEN']).optional(),
          createdAt: z.date().optional(),
        }),
      ),
      vertical: z.string().min(1).max(100).nullable(),
      tier: z.string().min(1).max(100).nullable(),
      maxStores: z.number().int().min(1),
      maxNegocios: z.number().int().min(1).nullable(),
      maxUsers: z.number().int().min(1),
      maxProducts: z.number().int().min(1).nullable(),
      status: z.enum(['ACTIVE', 'HIDDEN']),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
