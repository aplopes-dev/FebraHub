import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Falha ao emitir a NF-e na fiscal-api (spec erp/026, molde `nfse-issuance`).
 * Carrega a mensagem de negócio já traduzida — a tela mostra isso, nunca o
 * código cru. Mapeada para 422 (regra de negócio) pelo filtro de exceção.
 */
export class FiscalApiEmissionError extends DomainError {
  constructor(message: string, orgCode?: string) {
    super({
      internalMessage: `NF-e emission failed${orgCode ? ` (${orgCode})` : ''}: ${message}`,
      externalMessage: message,
      context: FiscalApiEmissionError.name,
    });
  }
}
