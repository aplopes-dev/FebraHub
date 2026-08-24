import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductAddonNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ProductAddon ${id} not found`,
      externalMessage: 'Adicional não encontrado',
      context: ProductAddonNotFoundError.name,
    });
  }
}
