import { BadRequestException } from '@nestjs/common';

export type SplitRuleInput = {
  recipientId: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  providerWalletId?: string;
  recipientExternalReference?: string;
};

export type ResolvedSplitRule = {
  recipientId: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  percentage: number | null;
  providerWalletId?: string;
  recipientExternalReference?: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validateSplitRules(chargeAmount: number, rules: SplitRuleInput[]): void {
  if (!rules.length) return;

  for (const rule of rules) {
    if (!rule.recipientId?.trim()) {
      throw new BadRequestException('splitRules: recipientId é obrigatório');
    }
    if (rule.value <= 0) {
      throw new BadRequestException('splitRules: value deve ser positivo');
    }
    if (rule.type === 'PERCENTAGE' && rule.value > 100) {
      throw new BadRequestException('splitRules: percentual não pode exceder 100');
    }
  }

  const resolved = resolveSplitAmounts(chargeAmount, rules);
  const total = roundMoney(resolved.reduce((sum, rule) => sum + rule.amount, 0));
  if (total > roundMoney(chargeAmount) + 0.01) {
    throw new BadRequestException(
      `splitRules: soma dos valores (${total}) excede o valor da cobrança (${chargeAmount})`,
    );
  }
}

export function resolveSplitAmounts(
  chargeAmount: number,
  rules: SplitRuleInput[],
): ResolvedSplitRule[] {
  return rules.map((rule) => {
    if (rule.type === 'FIXED') {
      return {
        recipientId: rule.recipientId,
        type: rule.type,
        amount: roundMoney(rule.value),
        percentage: null,
        providerWalletId: rule.providerWalletId,
        recipientExternalReference: rule.recipientExternalReference,
      };
    }
    return {
      recipientId: rule.recipientId,
      type: rule.type,
      amount: roundMoney((chargeAmount * rule.value) / 100),
      percentage: rule.value,
      providerWalletId: rule.providerWalletId,
      recipientExternalReference: rule.recipientExternalReference,
    };
  });
}
