import type { UpdateCardPaymentMethodInput } from '../../domain/entities/card-payment-method.entity';
import type { CardPaymentMethodWritableDto } from '../dtos/card-payment-method.dto';

/** Mesma semântica de PUT do contrato: campo omitido volta ao default. */
export function resolvePaymentMethodUpdateInput(
  dto: CardPaymentMethodWritableDto,
): UpdateCardPaymentMethodInput {
  const progressiveEnabled = dto.progressiveEnabled ?? false;

  return {
    type: dto.type,
    brand: dto.brand ?? null,
    rate: dto.rate ?? null,
    feeCents: dto.feeCents ?? null,
    settlementDays: dto.settlementDays ?? null,
    minInstallments: dto.minInstallments ?? null,
    maxInstallments: dto.maxInstallments ?? null,
    firstPaymentDays: dto.firstPaymentDays ?? null,
    daysBetweenInstallments: dto.daysBetweenInstallments ?? null,
    progressiveEnabled,
    rateTiers: progressiveEnabled ? (dto.progressiveTiers ?? []) : [],
  };
}
