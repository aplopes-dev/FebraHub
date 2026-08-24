import { PriceListInvalidDatesError } from '../../domain/errors/price-list-invalid-dates.error';

export function assertValidDates(
  startDate: Date | null,
  endDate: Date | null,
): void {
  if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    throw new PriceListInvalidDatesError();
  }
}
