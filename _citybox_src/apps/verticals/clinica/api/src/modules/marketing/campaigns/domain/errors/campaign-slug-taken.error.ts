import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignSlugTakenError extends DomainError {
  constructor(context: string, slug: string) {
    super({
      internalMessage: `Campaign slug already taken: ${slug}`,
      externalMessage: 'Já existe uma campanha com este identificador',
      context,
    });
  }
}
