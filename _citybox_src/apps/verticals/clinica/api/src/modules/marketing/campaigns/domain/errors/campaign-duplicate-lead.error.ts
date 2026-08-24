import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignDuplicateLeadError extends DomainError {
  constructor(context: string, phoneKey: string) {
    super({
      internalMessage: `Duplicate lead blocked for phoneKey=${phoneKey}`,
      externalMessage: 'Já existe um cadastro com este telefone nesta campanha',
      context,
    });
  }
}
