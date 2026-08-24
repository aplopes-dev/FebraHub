import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../../../../whatsapp/domain/default-templates';

export const ANIVERSARIO_GENDERS = ['male', 'female', 'other'] as const;
export type AniversarioGender = (typeof ANIVERSARIO_GENDERS)[number];

export const aniversarioContentSchema = z.object({
  planIds: z.array(z.string().min(1)).default([]),
  specialtyIds: z.array(z.string().min(1)).default([]),
  genders: z.array(z.enum(ANIVERSARIO_GENDERS)).default([]),
  messageBody: z.string().trim().min(1, 'Mensagem da campanha é obrigatória'),
});

export type AniversarioContent = z.infer<typeof aniversarioContentSchema>;

export const DEFAULT_ANIVERSARIO_MESSAGE_BODY =
  DEFAULT_WHATSAPP_TEMPLATES.birthday;

function normalizeAniversarioContent(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      planIds: [],
      specialtyIds: [],
      genders: [],
      messageBody: DEFAULT_ANIVERSARIO_MESSAGE_BODY,
    };
  }

  const obj = raw as Record<string, unknown>;
  const stepTwo =
    obj.stepTwo && typeof obj.stepTwo === 'object' && !Array.isArray(obj.stepTwo)
      ? (obj.stepTwo as Record<string, unknown>)
      : obj;

  const messageBody =
    typeof stepTwo.messageBody === 'string' && stepTwo.messageBody.trim()
      ? stepTwo.messageBody.trim()
      : DEFAULT_ANIVERSARIO_MESSAGE_BODY;

  return {
    planIds: Array.isArray(stepTwo.planIds)
      ? stepTwo.planIds.filter((id): id is string => typeof id === 'string')
      : [],
    specialtyIds: Array.isArray(stepTwo.specialtyIds)
      ? stepTwo.specialtyIds.filter((id): id is string => typeof id === 'string')
      : [],
    genders: Array.isArray(stepTwo.genders)
      ? stepTwo.genders.filter(
          (g): g is AniversarioGender =>
            g === 'male' || g === 'female' || g === 'other',
        )
      : [],
    messageBody,
  };
}

export function parseAniversarioContent(
  raw: unknown,
  context: string,
): AniversarioContent {
  const normalized = normalizeAniversarioContent(raw);
  try {
    return aniversarioContentSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = ZodUtils.formatZodError(error);
      throw new ValidatorDomainError({
        internalMessage: `Invalid aniversario content: ${msg}`,
        externalMessage: msg,
        context,
      });
    }
    throw error;
  }
}

export function birthdayMessageCorrelationId(
  campaignId: string,
  patientId: string,
  civilYmd: string,
): string {
  return `birthday:${campaignId}:${patientId}:${civilYmd}`;
}

/** Prefixo de `correlationId` para contar disparos de uma campanha aniversário. */
export function birthdayCampaignCorrelationPrefix(campaignId: string): string {
  return `birthday:${campaignId}:`;
}
