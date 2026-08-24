import { z } from 'zod';

import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

export const FORM_LEAD_FIELD_TYPES = [
  'text',
  'phone',
  'email',
  'radio',
  'checkbox',
  'textarea',
] as const;

export type FormLeadFieldType = (typeof FORM_LEAD_FIELD_TYPES)[number];

const questionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tag: z.string().optional(),
});

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(FORM_LEAD_FIELD_TYPES),
  label: z.string().min(1),
  required: z.boolean(),
  helpText: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
});

const lgpdConsentSchema = z.object({
  text: z.string().min(1),
  privacyPolicyUrl: z.string().optional(),
});

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const formLeadContentSchema = z
  .object({
    formDescription: z.string().optional(),
    ownerId: z.string().optional(),
    notifyOnLead: z.boolean(),
    notificationChannels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    duplicityRule: z.enum(['block', 'update', 'create_new']),
    fbPixelId: z.string().optional(),
    googleTagId: z.string().optional(),
    successAction: z.enum(['message', 'redirect']),
    successMessage: z.string().optional(),
    redirectUrl: z.string().optional(),
    introText: z.string().optional(),
    questions: z.array(questionSchema).min(2),
    lgpdConsent: lgpdConsentSchema,
    primaryColor: z
      .string()
      .regex(HEX_COLOR)
      .optional()
      .or(z.literal('')),
    logoUrl: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.successAction === 'message' && !data.successMessage?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mensagem de sucesso é obrigatória',
        path: ['successMessage'],
      });
    }
    if (data.successAction === 'redirect' && !data.redirectUrl?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'URL de redirecionamento é obrigatória',
        path: ['redirectUrl'],
      });
    }
    const hasName = data.questions.some(
      (q) => q.id === 'field-name' && q.required === true,
    );
    const hasPhone = data.questions.some(
      (q) => q.id === 'field-phone' && q.required === true,
    );
    if (!hasName || !hasPhone) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Os campos Nome e Telefone são obrigatórios e não podem ser removidos',
        path: ['questions'],
      });
    }
    for (const [index, q] of data.questions.entries()) {
      if (
        (q.type === 'radio' || q.type === 'checkbox') &&
        (!q.options || q.options.length < 2)
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Perguntas do tipo radio ou checkbox devem ter pelo menos 2 opções',
          path: ['questions', index, 'options'],
        });
      }
    }
  });

export type FormLeadContent = z.infer<typeof formLeadContentSchema>;

function cleanOptionalString(
  value: unknown,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return undefined;
  return trimmed;
}

/**
 * Sem protocolo (`www.instagram.com`), o browser trata como path relativo
 * e concatena com a URL atual da campanha.
 */
function toAbsoluteExternalUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function normalizeLgpdConsent(lgpdConsent: unknown): unknown {
  if (!lgpdConsent || typeof lgpdConsent !== 'object' || Array.isArray(lgpdConsent)) {
    return lgpdConsent;
  }
  const consent = lgpdConsent as Record<string, unknown>;
  const privacyPolicyUrl = toAbsoluteExternalUrl(
    cleanOptionalString(consent.privacyPolicyUrl),
  );
  return {
    ...consent,
    ...(privacyPolicyUrl !== undefined ? { privacyPolicyUrl } : {}),
  };
}

type WizardStepTwo = Record<string, unknown>;
type WizardStepThree = Record<string, unknown>;

/**
 * Aceita content canônico ou o shape do wizard ERP (stepTwo/stepThree/stepFour).
 */
export function normalizeFormLeadContent(
  raw: unknown,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const hasWizardShape =
    'stepTwo' in obj || 'stepThree' in obj || 'stepFour' in obj;

  if (!hasWizardShape) {
    const redirectUrl = toAbsoluteExternalUrl(
      cleanOptionalString(obj.redirectUrl),
    );
    const lgpdConsent = normalizeLgpdConsent(obj.lgpdConsent);
    return {
      ...obj,
      ...(redirectUrl !== undefined ? { redirectUrl } : {}),
      ...(lgpdConsent !== undefined ? { lgpdConsent } : {}),
    };
  }

  const stepTwo = (obj.stepTwo ?? {}) as WizardStepTwo;
  const stepThree = (obj.stepThree ?? {}) as WizardStepThree;

  return {
    formDescription: cleanOptionalString(stepTwo.formDescription),
    ownerId: cleanOptionalString(stepTwo.ownerId),
    notifyOnLead: Boolean(stepTwo.notifyOnLead ?? false),
    notificationChannels: Array.isArray(stepTwo.notificationChannels)
      ? (stepTwo.notificationChannels as string[])
      : undefined,
    tags: Array.isArray(stepTwo.tags) ? (stepTwo.tags as string[]) : undefined,
    duplicityRule: stepTwo.duplicityRule ?? 'block',
    fbPixelId: cleanOptionalString(stepTwo.fbPixelId),
    googleTagId: cleanOptionalString(stepTwo.googleTagId),
    successAction: stepTwo.successAction ?? 'message',
    successMessage: cleanOptionalString(stepTwo.successMessage),
    redirectUrl: toAbsoluteExternalUrl(
      cleanOptionalString(stepTwo.redirectUrl),
    ),
    introText: cleanOptionalString(stepThree.introText),
    questions: stepThree.questions,
    lgpdConsent: normalizeLgpdConsent(stepThree.lgpdConsent),
    primaryColor: cleanOptionalString(stepThree.primaryColor) ?? '',
    logoUrl: cleanOptionalString(stepThree.logoUrl) ?? '',
  };
}

export function parseFormLeadContent(
  raw: unknown,
  context: string,
): FormLeadContent {
  const normalized = normalizeFormLeadContent(raw);
  try {
    return formLeadContentSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = ZodUtils.formatZodError(error);
      throw new ValidatorDomainError({
        internalMessage: `Invalid form_lead content: ${msg}`,
        externalMessage: msg,
        context,
      });
    }
    throw error;
  }
}
