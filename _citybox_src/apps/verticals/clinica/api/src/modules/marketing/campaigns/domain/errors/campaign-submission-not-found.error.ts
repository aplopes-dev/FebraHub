import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignSubmissionNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Campaign submission not found: ${id}`,
      externalMessage: 'Resposta do formulário não encontrada',
      context,
    });
  }
}
