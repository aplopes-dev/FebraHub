import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvalidSplitError } from '../../../../transactions/domain/errors/invalid-split.error';
import {
  isSplitValid,
  sumSplitPercents,
} from '../../../../transactions/application/policies/commission-split.math';
import type { CommissionConfigEntity } from '../../../domain/entities/commission-config.entity';
import { CommissionConfigRepository } from '../../../domain/repositories/commission-config.repository.interface';

export type PutCommissionConfigInput = {
  storeId: string;
  global: {
    defaultCommissionPercent: number;
    defaultSplit: {
      agencyPercent: number;
      captorPercent: number;
      sellerPercent: number;
    };
  };
  agentOverrides: {
    agentId: string;
    captorPercentOverride: number;
    sellerPercentOverride?: number | null;
  }[];
};

@Injectable()
export class PutCommissionConfigUseCase implements IUseCase<
  PutCommissionConfigInput,
  CommissionConfigEntity
> {
  constructor(private readonly configs: CommissionConfigRepository) {}

  async execute(
    input: PutCommissionConfigInput,
  ): Promise<CommissionConfigEntity> {
    const { defaultSplit, defaultCommissionPercent } = input.global;

    if (defaultCommissionPercent < 0 || defaultCommissionPercent > 100) {
      throw new InvalidSplitError(
        'A comissão padrão deve estar entre 0% e 100%.',
      );
    }
    if (!isSplitValid(defaultSplit)) {
      throw new InvalidSplitError(
        `A soma dos percentuais é ${sumSplitPercents(defaultSplit).toFixed(1)}%. Deve ser 100%.`,
      );
    }

    return this.configs.upsert(input.storeId, {
      global: { defaultCommissionPercent, defaultSplit },
      agentOverrides: input.agentOverrides.map((override) => ({
        agentId: override.agentId,
        captorPercentOverride: override.captorPercentOverride,
        sellerPercentOverride: override.sellerPercentOverride ?? null,
      })),
    });
  }
}
