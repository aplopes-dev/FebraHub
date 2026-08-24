import { z } from 'zod';
import {
  buildCommissionSplit as buildCommissionSplitMath,
  isSplitValid,
  sumSplitPercents,
} from '../utils/commission-split-math';

export {
  amountToPercent,
  buildCommissionSplit,
  isSplitValid,
  percentToAmount,
  recalculateSplitAmounts,
  sumSplitPercents,
} from '../utils/commission-split-math';

export const commissionOtherSplitSchema = z.object({
  label: z.string().min(1),
  percent: z.number().min(0).max(100),
  amountCents: z.number().int().min(0),
});

export const commissionSplitPercentsSchema = z.object({
  agencyPercent: z.number().min(0).max(100),
  captorPercent: z.number().min(0).max(100),
  sellerPercent: z.number().min(0).max(100),
});

export const commissionSplitSchema = commissionSplitPercentsSchema
  .extend({
    others: z.array(commissionOtherSplitSchema).default([]),
    agencyAmountCents: z.number().int().min(0),
    captorAmountCents: z.number().int().min(0),
    sellerAmountCents: z.number().int().min(0),
    totalCommissionCents: z.number().int().min(0),
  })
  .refine(
    (split) => {
      const othersSum = split.others.reduce((sum, o) => sum + o.percent, 0);
      const total =
        split.agencyPercent + split.captorPercent + split.sellerPercent + othersSum;
      return Math.abs(total - 100) < 0.01;
    },
    { message: 'A soma dos percentuais do split deve ser 100%' },
  );

export const rentalDeductionSchema = z.object({
  label: z.string().min(1),
  amountCents: z.number().int().min(0),
});

export const rentalConfigSchema = z.object({
  landlordName: z.string().min(1),
  tenantName: z.string().min(1),
  baseRentCents: z.number().int().min(0),
  condoCents: z.number().int().min(0),
  iptuCents: z.number().int().min(0),
  adminFeePercent: z.number().min(0).max(100),
  dueDay: z.number().int().min(1).max(31),
  payoutStatus: z.enum([
    'AWAITING_PAYMENT',
    'PAID_BY_TENANT',
    'READY_FOR_PAYOUT',
    'PAID_TO_LANDLORD',
  ]),
  receivedCents: z.number().int().min(0),
  deductions: z.array(rentalDeductionSchema),
  paidAt: z.string().optional(),
  payoutAt: z.string().optional(),
});

export const updateSplitSchema = z.object({
  split: commissionSplitSchema,
  splitSource: z.enum(['GLOBAL', 'AGENT_OVERRIDE', 'MANUAL']),
});

/** Wrapper tipado para validação Zod após cálculo. */
export function buildValidatedCommissionSplit(
  grossValueCents: number,
  commissionPercent: number,
  percents: {
    agencyPercent: number;
    captorPercent: number;
    sellerPercent: number;
    others?: readonly { label: string; percent: number }[];
  },
): z.infer<typeof commissionSplitSchema> {
  return buildCommissionSplitMath(grossValueCents, commissionPercent, percents);
}
