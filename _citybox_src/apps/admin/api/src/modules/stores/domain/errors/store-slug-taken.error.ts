import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreSlugTakenError extends DomainError {
  constructor(context: string, slug: string) {
    super({
      internalMessage: `Duplicate slug: ${slug}`,
      externalMessage: 'Este slug já está em uso',
      context,
    });
  }
}
