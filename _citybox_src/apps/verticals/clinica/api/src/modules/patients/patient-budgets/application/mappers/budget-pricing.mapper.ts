import type { BudgetUpsertPayload } from '../dtos/budget.dto';
import { BudgetInvalidPricingError } from '../../domain/errors/budget-invalid-pricing.error';
import {
  calculateFinalValueCents,
  sumBudgetItemCents,
  validateInstallmentSum,
} from '../utils/budget-pricing.utils';
import type { BudgetDiscountType } from '../../domain/entities/budget.entity';

export type ResolvedBudgetPricing = {
  subtotalCents: number;
  finalValueCents: number;
  discountType: BudgetDiscountType | null;
  discountValue: number | null;
};

export function resolveBudgetPricing(
  context: string,
  input: BudgetUpsertPayload,
): ResolvedBudgetPricing {
  if (input.items.length < 1) {
    throw new BudgetInvalidPricingError(context, 'at least one item required');
  }

  const subtotalCents = sumBudgetItemCents(input.items);
  const finalValueCents = calculateFinalValueCents(
    subtotalCents,
    input.discount,
  );

  try {
    validateInstallmentSum({
      finalValueCents,
      downPaymentCents: input.installmentEnabled ? input.downPaymentCents : 0,
      installmentsCount: input.installmentEnabled ? input.installmentsCount : 0,
      installmentEnabled: input.installmentEnabled,
    });
  } catch {
    throw new BudgetInvalidPricingError(
      context,
      'invalid installment configuration',
    );
  }

  return {
    subtotalCents,
    finalValueCents,
    discountType: input.discount?.type ?? null,
    discountValue: input.discount?.value ?? null,
  };
}
