import type { CommissionConfigEntity } from '../../../../domain/entities/commission-config.entity';

/** Shape HTTP da configuração de comissão (`CommissionConfigState` no web). */
export function mapCommissionConfigToHttp(config: CommissionConfigEntity) {
  return {
    global: {
      defaultCommissionPercent: config.defaultCommissionPercent,
      defaultSplit: {
        agencyPercent: config.defaultSplit.agencyPercent,
        captorPercent: config.defaultSplit.captorPercent,
        sellerPercent: config.defaultSplit.sellerPercent,
      },
    },
    agentOverrides: config.agentOverrides.map((override) => ({
      agentId: override.agentId,
      captorPercentOverride: override.captorPercentOverride,
      sellerPercentOverride: override.sellerPercentOverride ?? undefined,
    })),
  };
}
