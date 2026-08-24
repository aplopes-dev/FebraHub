import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Campaign not found: ${id}`,
      externalMessage: 'Campanha não encontrada',
      context,
    });
  }
}
