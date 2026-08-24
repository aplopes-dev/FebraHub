import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Já existe turno aberto neste terminal → 409 (sufixo Taken). */
export class PosCashSessionOpenTakenError extends DomainError {
  constructor(posTerminalId: string) {
    super({
      internalMessage: `PosCashSession already open for terminal ${posTerminalId}`,
      externalMessage:
        'Já existe um caixa aberto neste terminal. Feche o turno atual antes de abrir outro.',
      context: PosCashSessionOpenTakenError.name,
    });
  }
}
