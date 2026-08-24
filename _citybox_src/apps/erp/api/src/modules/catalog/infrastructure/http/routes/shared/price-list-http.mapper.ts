import type { PriceAdjustmentType } from '../../../../domain/entities/price-list.entity';
import type { SavePriceListDto } from '../shared/price-list.dto';

export function parseOptionalDate(
  value: string | null | undefined,
): Date | null {
  if (value == null || value === '') return null;
  return new Date(value);
}

export function toSavePriceListFields(dto: SavePriceListDto) {
  return {
    name: dto.name,
    adjustmentType: dto.adjustmentType as PriceAdjustmentType,
    adjustmentValue: dto.adjustmentValue,
    channels: dto.channels ?? [],
    startDate: parseOptionalDate(dto.startDate),
    endDate: parseOptionalDate(dto.endDate),
    active: dto.active ?? true,
  };
}
