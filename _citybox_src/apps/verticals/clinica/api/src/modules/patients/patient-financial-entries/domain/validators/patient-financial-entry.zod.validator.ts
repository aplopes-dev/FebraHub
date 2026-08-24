import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const debitTreatmentSchema = z.object({
  id: z.string().min(1),
  planId: z.string().min(1),
  treatmentId: z.string().min(1),
  treatmentName: z.string().min(1),
  valueCents: z.number().int().positive(),
  professionalId: z.string().min(1),
  toothNumber: z.number().int().nullable(),
});

export const avulsoDebitInputSchema = z.object({
  dueDate: z.coerce.date(),
  observations: z.string(),
  treatments: z.array(debitTreatmentSchema).min(1),
});

export type AvulsoDebitInput = z.infer<typeof avulsoDebitInputSchema>;

/** Update parcial: observações + valor/dentista por linha (ou só valueCents em parcela). */
export const updatePendingDebitInputSchema = z
  .object({
    observations: z.string(),
    valueCents: z.number().int().positive().optional(),
    treatments: z
      .array(
        z.object({
          id: z.string().min(1),
          valueCents: z.number().int().positive(),
          professionalId: z.string().min(1),
        }),
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasTreatments = (value.treatments?.length ?? 0) > 0;
    if (!hasTreatments && value.valueCents === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe valueCents ou treatments',
        path: ['valueCents'],
      });
    }
  });

export type UpdatePendingDebitInput = z.infer<typeof updatePendingDebitInputSchema>;

export function parseUpdatePendingDebitInput(
  context: string,
  input: unknown,
): UpdatePendingDebitInput {
  const result = updatePendingDebitInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidatorDomainError({
      internalMessage: result.error.issues.map((i) => i.message).join('; '),
      externalMessage: 'Dados da edição do débito inválidos',
      context,
    });
  }
  return result.data;
}

export const receiveFinancialEntryInputSchema = z.object({
  paymentMethod: z.enum([
    'cash',
    'credit',
    'debit',
    'pix',
    'transfer',
    'boleto',
    'check',
  ]),
  paidValueCents: z.number().int().positive(),
  receivedAt: z.coerce.date(),
  cashRegisterId: z.string().min(1),
  observations: z.string(),
  cardMode: z.enum(['no-fee', 'with-fee']).optional(),
  checkIssueDate: z.coerce.date().optional(),
  checkHolderName: z.string().optional(),
  checkNumber: z.string().optional(),
  checkBank: z.string().optional(),
  checkDocument: z.string().optional(),
});

export type ReceiveFinancialEntryInput = z.infer<
  typeof receiveFinancialEntryInputSchema
>;

export function parseAvulsoDebitInput(
  context: string,
  input: unknown,
): AvulsoDebitInput {
  const result = avulsoDebitInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidatorDomainError({
      internalMessage: result.error.issues.map((i) => i.message).join('; '),
      externalMessage: 'Dados do débito avulso inválidos',
      context,
    });
  }
  return result.data;
}

export function parseReceiveFinancialEntryInput(
  context: string,
  input: unknown,
): ReceiveFinancialEntryInput {
  const result = receiveFinancialEntryInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidatorDomainError({
      internalMessage: result.error.issues.map((i) => i.message).join('; '),
      externalMessage: 'Dados do recebimento inválidos',
      context,
    });
  }
  return result.data;
}
