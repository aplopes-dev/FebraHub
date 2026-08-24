import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Falha ao emitir a NFS-e na fiscal-api (spec erp/018). Carrega a mensagem de
 * negócio já traduzida (E0116 IM não no CNC, E0310 código nacional ausente,
 * E0625 alíquota sem retenção, indisponibilidade, …) — a tela mostra isso, nunca
 * o código cru. Mapeada para 422 (regra de negócio) pelo filtro de exceção.
 */
export class FiscalApiEmissionError extends DomainError {
  constructor(message: string, orgCode?: string) {
    super({
      internalMessage: `NFS-e emission failed${orgCode ? ` (${orgCode})` : ''}: ${message}`,
      externalMessage: message,
      context: FiscalApiEmissionError.name,
    });
  }
}
