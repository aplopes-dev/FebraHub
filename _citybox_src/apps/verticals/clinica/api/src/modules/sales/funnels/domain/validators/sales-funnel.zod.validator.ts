import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

import type { SalesFunnel } from '../entities/sales-funnel.entity';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const stageSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  funnelId: z.string().uuid(),
  name: z.string().min(1).max(80),
  type: z.enum(['others', 'won', 'lost']),
  color: z.string().regex(HEX_COLOR),
  order: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const funnelSchema = z
  .object({
    id: z.string().uuid(),
    storeId: z.string().min(1),
    name: z.string().min(1).max(120),
    isDefault: z.boolean(),
    stages: z.array(stageSchema).min(3),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    const won = data.stages.filter((s) => s.type === 'won');
    const lost = data.stages.filter((s) => s.type === 'lost');
    const others = data.stages.filter((s) => s.type === 'others');
    if (won.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Funil deve ter exatamente uma etapa ganha (won)',
      });
    }
    if (lost.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Funil deve ter exatamente uma etapa perdida (lost)',
      });
    }
    if (others.length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Funil deve ter ao menos uma etapa aberta (others)',
      });
    }
    if (won[0] && won[0].order !== 998) {
      ctx.addIssue({
        code: 'custom',
        message: 'Etapa won deve ter order 998',
      });
    }
    if (lost[0] && lost[0].order !== 999) {
      ctx.addIssue({
        code: 'custom',
        message: 'Etapa lost deve ter order 999',
      });
    }
  });

export class SalesFunnelZodValidator implements Validator<SalesFunnel> {
  private constructor() {}

  public static create(): SalesFunnelZodValidator {
    return new SalesFunnelZodValidator();
  }

  public validate(input: SalesFunnel): void {
    try {
      funnelSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        isDefault: input.props.isDefault,
        stages: input.props.stages,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating SalesFunnel ${input.id}: ${msg}`,
          externalMessage: msg,
          context: SalesFunnelZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating SalesFunnel: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o funil',
        context: SalesFunnelZodValidator.name,
      });
    }
  }
}
