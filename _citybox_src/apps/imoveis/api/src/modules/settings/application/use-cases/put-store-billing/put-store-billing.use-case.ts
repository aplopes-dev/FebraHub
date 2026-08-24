import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  DEFAULT_BILLING_SETTINGS,
  isBillingStatus,
  StoreSettingsEntity,
  type StoreBillingSettings,
} from '../../../domain/entities/store-settings.entity';
import { InvalidBillingStatusError } from '../../../domain/errors/invalid-billing-status.error';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export type PutStoreBillingInput = {
  storeId: string;
  planName?: string;
  status?: string;
  renewsAt?: string | null;
  amountCents?: number;
};

function parseRenewsAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Update parcial — campo ausente mantém o valor atual da loja. */
@Injectable()
export class PutStoreBillingUseCase implements IUseCase<
  PutStoreBillingInput,
  StoreSettingsEntity
> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(input: PutStoreBillingInput): Promise<StoreSettingsEntity> {
    const existing = await this.settings.findByStoreId(input.storeId);
    const current =
      existing?.billing ?? StoreSettingsEntity.default(input.storeId).billing;

    const billing: StoreBillingSettings = {
      planName: input.planName?.trim() || current.planName,
      status: this.resolveStatus(input.status, current.status),
      renewsAt:
        input.renewsAt === undefined
          ? current.renewsAt
          : parseRenewsAt(input.renewsAt),
      amountCents:
        typeof input.amountCents === 'number'
          ? Math.max(0, Math.trunc(input.amountCents))
          : current.amountCents,
    };

    return this.settings.updateBilling(input.storeId, billing);
  }

  private resolveStatus(
    value: string | undefined,
    fallback: StoreBillingSettings['status'],
  ): StoreBillingSettings['status'] {
    if (value === undefined) return fallback;
    const normalized = value.trim().toLowerCase();
    if (!isBillingStatus(normalized)) {
      throw new InvalidBillingStatusError(PutStoreBillingUseCase.name, value);
    }
    return normalized || DEFAULT_BILLING_SETTINGS.status;
  }
}
