import { DomainError } from '../../../../../shared/core/errors/domain.error';

import type { CampaignType } from '../campaign.types';

export class CampaignTypeNotImplementedError extends DomainError {
  constructor(context: string, type: CampaignType | string) {
    super({
      internalMessage: `Campaign type not implemented: ${type}`,
      externalMessage:
        'Este tipo de campanha ainda não está disponível para criação',
      context,
    });
  }
}
