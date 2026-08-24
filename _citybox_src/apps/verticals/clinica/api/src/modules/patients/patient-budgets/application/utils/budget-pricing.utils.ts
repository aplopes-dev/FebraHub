export type BudgetDiscountInput = {
  type: 'fixed' | 'percent';
  value: number;
};

export function sumBudgetItemCents(items: { valueCents: number }[]): number {
  return items.reduce((total, item) => total + item.valueCents, 0);
}

export function calculateDiscountCents(
  subtotalCents: number,
  discount: BudgetDiscountInput | null,
): number {
  if (!discount) return 0;

  if (discount.type === 'fixed') {
    return Math.min(subtotalCents, Math.max(0, discount.value));
  }

  // Contrato API: percent em centésimos (1050 = 10,5%; 2000 = 20%).
  // Dividir só por 100 tratava 20% como 2000% e zera o finalValueCents.
  const percentCentesimal = Math.max(0, discount.value);
  if (percentCentesimal <= 0) return 0;

  return Math.min(
    subtotalCents,
    Math.round(subtotalCents * (percentCentesimal / 10_000)),
  );
}

export function calculateFinalValueCents(
  subtotalCents: number,
  discount: BudgetDiscountInput | null,
): number {
  return Math.max(
    0,
    subtotalCents - calculateDiscountCents(subtotalCents, discount),
  );
}

export function calculateInstallmentBalanceCents(
  finalCents: number,
  downPaymentCents: number,
): number {
  return Math.max(0, finalCents - downPaymentCents);
}

export function calculateInstallmentAmountCents(
  balanceCents: number,
  installmentsCount: number,
): number {
  if (installmentsCount <= 0) return 0;
  return Math.round(balanceCents / installmentsCount);
}

export function distributeInstallmentAmounts(
  balanceCents: number,
  installmentsCount: number,
): number[] {
  if (installmentsCount <= 0) return [];

  const baseAmount = Math.floor(balanceCents / installmentsCount);
  const amounts = Array.from(
    { length: installmentsCount - 1 },
    () => baseAmount,
  );
  const lastAmount = balanceCents - baseAmount * (installmentsCount - 1);
  amounts.push(lastAmount);
  return amounts;
}

export function validateInstallmentSum(params: {
  finalValueCents: number;
  downPaymentCents: number;
  installmentsCount: number;
  installmentEnabled: boolean;
}): void {
  const {
    finalValueCents,
    downPaymentCents,
    installmentsCount,
    installmentEnabled,
  } = params;

  if (!installmentEnabled) {
    if (downPaymentCents !== 0 || installmentsCount !== 0) {
      throw new Error('INSTALLMENT_DISABLED_MUST_BE_ZERO');
    }
    return;
  }

  if (installmentsCount < 1) {
    throw new Error('INSTALLMENT_COUNT_REQUIRED');
  }

  if (downPaymentCents < 0 || downPaymentCents > finalValueCents) {
    throw new Error('INSTALLMENT_DOWN_PAYMENT_INVALID');
  }

  const balanceCents = calculateInstallmentBalanceCents(
    finalValueCents,
    downPaymentCents,
  );
  const installmentAmounts = distributeInstallmentAmounts(
    balanceCents,
    installmentsCount,
  );
  const totalCents =
    downPaymentCents +
    installmentAmounts.reduce((sum, amount) => sum + amount, 0);

  if (totalCents !== finalValueCents) {
    throw new Error('INSTALLMENT_SUM_MISMATCH');
  }
}
