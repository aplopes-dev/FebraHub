/** Funções puras de split — sem Zod (seguro para client components). */

export function sumSplitPercents(split: {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others?: readonly { percent: number }[];
}): number {
  const othersSum = (split.others ?? []).reduce((sum, o) => sum + o.percent, 0);
  return split.agencyPercent + split.captorPercent + split.sellerPercent + othersSum;
}

export function isSplitValid(split: {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others?: readonly { percent: number }[];
}): boolean {
  return Math.abs(sumSplitPercents(split) - 100) < 0.01;
}

export function percentToAmount(totalCents: number, percent: number): number {
  return Math.round((totalCents * percent) / 100);
}

export function amountToPercent(totalCents: number, amountCents: number): number {
  if (totalCents <= 0) return 0;
  return (amountCents / totalCents) * 100;
}

export function recalculateSplitAmounts(
  grossValueCents: number,
  commissionPercent: number,
  percents: {
    agencyPercent: number;
    captorPercent: number;
    sellerPercent: number;
    others?: readonly { label: string; percent: number }[];
  },
): {
  agencyAmountCents: number;
  captorAmountCents: number;
  sellerAmountCents: number;
  others: { label: string; percent: number; amountCents: number }[];
  totalCommissionCents: number;
} {
  const totalCommissionCents = percentToAmount(grossValueCents, commissionPercent);
  const others = (percents.others ?? []).map((o) => ({
    label: o.label,
    percent: o.percent,
    amountCents: percentToAmount(totalCommissionCents, o.percent),
  }));
  return {
    agencyAmountCents: percentToAmount(totalCommissionCents, percents.agencyPercent),
    captorAmountCents: percentToAmount(totalCommissionCents, percents.captorPercent),
    sellerAmountCents: percentToAmount(totalCommissionCents, percents.sellerPercent),
    others,
    totalCommissionCents,
  };
}

export function buildCommissionSplit(
  grossValueCents: number,
  commissionPercent: number,
  percents: {
    agencyPercent: number;
    captorPercent: number;
    sellerPercent: number;
    others?: readonly { label: string; percent: number }[];
  },
) {
  const amounts = recalculateSplitAmounts(grossValueCents, commissionPercent, percents);
  return {
    agencyPercent: percents.agencyPercent,
    captorPercent: percents.captorPercent,
    sellerPercent: percents.sellerPercent,
    others: amounts.others,
    agencyAmountCents: amounts.agencyAmountCents,
    captorAmountCents: amounts.captorAmountCents,
    sellerAmountCents: amounts.sellerAmountCents,
    totalCommissionCents: amounts.totalCommissionCents,
  };
}
