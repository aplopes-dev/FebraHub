import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductAddonNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Product addon name ${name} already taken in this organization`,
      externalMessage: `Já existe um adicional com o nome "${name}"`,
      context: ProductAddonNameTakenError.name,
    });
  }
}
