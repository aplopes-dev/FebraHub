import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosTerminalNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PosTerminal ${id} not found in the current organization`,
      externalMessage: 'Terminal de PDV não encontrado',
      context: PosTerminalNotFoundError.name,
    });
  }
}
