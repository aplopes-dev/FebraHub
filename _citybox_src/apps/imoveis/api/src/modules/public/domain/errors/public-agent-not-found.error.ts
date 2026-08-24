import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PublicAgentNotFoundError extends DomainError {
  constructor(context: string, slug: string) {
    super({
      internalMessage: `Public agent not found: ${slug}`,
      externalMessage: 'Corretor não encontrado.',
      context,
    });
  }
}
