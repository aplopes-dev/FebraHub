import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

import type { SalesOpportunity } from '../entities/sales-opportunity.entity';

const ORIGINS = [
  'instagram',
  'facebook',
  'google',
  'whatsapp',
  'site',
  'indicacao',
  'retorno',
  'campaign',
  'budget',
  'outro',
] as const;

const opportunitySchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().min(1),
  funnelId: z.string().uuid(),
  stageId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable(),
  phone: z.string().max(32).nullable(),
  origin: z.enum(ORIGINS).nullable(),
  nextContact: z.date().nullable(),
  patientId: z.string().uuid().nullable(),
  labelId: z.string().uuid().nullable(),
  submissionId: z.string().nullable(),
  budgetId: z.string().uuid().nullable(),
  sortOrder: z.number().int().min(0),
  lastInteractionAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class SalesOpportunityZodValidator implements Validator<SalesOpportunity> {
  private constructor() {}

  public static create(): SalesOpportunityZodValidator {
    return new SalesOpportunityZodValidator();
  }

  public validate(input: SalesOpportunity): void {
    try {
      opportunitySchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        funnelId: input.props.funnelId,
        stageId: input.props.stageId,
        title: input.props.title,
        description: input.props.description,
        phone: input.props.phone,
        origin: input.props.origin,
        nextContact: input.props.nextContact,
        patientId: input.props.patientId,
        labelId: input.props.labelId,
        submissionId: input.props.submissionId,
        budgetId: input.props.budgetId,
        sortOrder: input.props.sortOrder,
        lastInteractionAt: input.props.lastInteractionAt,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating SalesOpportunity ${input.id}: ${msg}`,
          externalMessage: msg,
          context: SalesOpportunityZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating SalesOpportunity: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a oportunidade',
        context: SalesOpportunityZodValidator.name,
      });
    }
  }
}
