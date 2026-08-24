import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CampaignInvalidFunnelError extends DomainError {
  constructor(context: string, detail: string) {
    super({
      internalMessage: `Invalid campaign funnel/stage: ${detail}`,
      externalMessage: 'Funil ou etapa de vendas inválidos para esta loja',
      context,
    });
  }
}
