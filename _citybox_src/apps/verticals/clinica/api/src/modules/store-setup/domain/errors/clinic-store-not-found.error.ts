import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClinicStoreNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `ClinicStore not found for storeId=${storeId}`,
      externalMessage: 'Loja não encontrada na vertical Clínica',
      context,
    });
  }
}
