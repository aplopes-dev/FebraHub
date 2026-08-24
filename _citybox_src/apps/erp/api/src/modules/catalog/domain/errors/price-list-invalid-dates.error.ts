import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PriceListInvalidDatesError extends DomainError {
  constructor() {
    super({
      internalMessage: 'Price list endDate is before startDate',
      externalMessage:
        'A data final da vigência deve ser posterior à data inicial',
      context: PriceListInvalidDatesError.name,
    });
  }
}
