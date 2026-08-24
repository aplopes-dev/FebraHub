import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleCashSessionRequiredError extends DomainError {
  constructor(posTerminalId: string) {
    super({
      internalMessage: `No open PosCashSession for terminal ${posTerminalId}`,
      externalMessage: 'Abra o caixa neste terminal antes de registrar vendas.',
      context: PosSaleCashSessionRequiredError.name,
    });
  }
}
