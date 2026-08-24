import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Fechar um pedido com linhas de produto controlado exige um depósito de saída. */
export class SaleOrderStockRequiredError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'SaleOrder cannot be closed without a stockId when it has trackable lines',
      externalMessage:
        'Selecione um estoque para dar baixa nos produtos deste pedido.',
      context: SaleOrderStockRequiredError.name,
    });
  }
}
