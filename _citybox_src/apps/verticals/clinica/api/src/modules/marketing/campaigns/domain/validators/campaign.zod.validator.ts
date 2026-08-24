import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

import type { Campaign } from '../entities/campaign.entity';
import { aniversarioContentSchema } from '../content/aniversario.content';
import { formLeadContentSchema } from '../content/form-lead.content';

const campaignPropsSchema = z
  .object({
    storeId: z.string().min(1),
    name: z.string().min(3).max(200),
    slug: z.string().min(1).max(80),
    segment: z.enum([
      'captacao_leads',
      'operacional_atendimento',
      'relacionamento_pos_venda',
    ]),
    type: z.enum([
      'form_lead',
      'mgm',
      'debito_atraso',
      'retorno_tratamento',
      'aniversario',
      'nps',
    ]),
    strategy: z.enum(['PAGE', 'BROADCAST', 'AUTOMATION']),
    status: z.enum(['draft', 'active', 'inactive', 'paused', 'finished']),
    channel: z.enum(['web', 'whatsapp', 'sms']),
    statusType: z.enum(['always_active', 'period', 'limit']),
    startDate: z.date().optional().nullable(),
    endDate: z.date().optional().nullable(),
    leadLimit: z.number().int().positive().optional().nullable(),
    views: z.number().int().nonnegative(),
    submissions: z.number().int().nonnegative(),
    funnelId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
    content: z.record(z.string(), z.unknown()),
    publicUrl: z.string().optional().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.statusType === 'period') {
      if (!data.endDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Data final é obrigatória para campanha por período',
          path: ['endDate'],
        });
      }
    }
    if (data.statusType === 'limit') {
      if (data.leadLimit == null || data.leadLimit <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Limite de leads deve ser maior que zero',
          path: ['leadLimit'],
        });
      }
    }
    if (data.funnelId && !data.stageId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione uma etapa do funil',
        path: ['stageId'],
      });
    }
  });

export class CampaignZodValidator implements Validator<Campaign> {
  private constructor() {}

  public static create(): CampaignZodValidator {
    return new CampaignZodValidator();
  }

  public validate(input: Campaign): void {
    try {
      campaignPropsSchema.parse({
        ...input.props,
        content: input.props.content as Record<string, unknown>,
      });
      if (input.type === 'form_lead') {
        formLeadContentSchema.parse(input.props.content);
      }
      if (input.type === 'aniversario') {
        aniversarioContentSchema.parse(input.props.content);
      }
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Campaign ${input.id}: ${msg}`,
          externalMessage: msg,
          context: CampaignZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Campaign: ${err.message}`,
        externalMessage: 'Houve um erro ao validar a campanha',
        context: CampaignZodValidator.name,
      });
    }
  }
}
