import type { ProviderSplitRule } from '../payment-provider.interface.js';

export function buildAsaasSplitPayload(rules: ProviderSplitRule[]): Record<string, unknown>[] {
  return rules
    .filter((rule) => rule.providerWalletId)
    .map((rule) => {
      const entry: Record<string, unknown> = { walletId: rule.providerWalletId };
      if (rule.type === 'FIXED') {
        entry.fixedValue = rule.amount;
      } else {
        entry.percentualValue = rule.percentage;
      }
      return entry;
    });
}
