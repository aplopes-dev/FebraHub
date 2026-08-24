import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DealPropertyRequiredForStageError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Deal requires linked property for stage property_selected: id=${id}`,
      externalMessage:
        'Vincule um imóvel ao lead antes de mover para Imóvel selecionado.',
      context: 'DealPropertyRequiredForStageError',
    });
  }
}
