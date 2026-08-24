import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PlanVerticalMismatchError extends DomainError {
  constructor(
    context: string,
    storeVertical: string,
    planVertical: string | null,
  ) {
    super({
      internalMessage: `Plan vertical "${planVertical}" does not match store vertical "${storeVertical}"`,
      externalMessage: 'O plano selecionado não pertence à vertical desta loja',
      context,
    });
  }
}
