import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignNotAcceptingSubmissionsError extends DomainError {
  constructor(context: string, campaignId: string) {
    super({
      internalMessage: `Campaign not accepting submissions: ${campaignId}`,
      externalMessage: 'Esta campanha não está aceitando respostas no momento',
      context,
    });
  }
}
