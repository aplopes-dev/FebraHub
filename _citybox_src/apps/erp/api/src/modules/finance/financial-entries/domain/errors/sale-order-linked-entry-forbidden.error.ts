import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * Lançamento gerado automaticamente pelo fechamento de um pedido de venda
 * fica inteiro somente-leitura — reescrevê-lo pela tela romperia o rastro
 * entre a venda e o dinheiro que ela gerou. Exclusão/restauração continuam
 * permitidas (RN-12/FR-017); só edição de campo é bloqueada.
 */
export class SaleOrderLinkedEntryForbiddenError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry ${id} is linked to a sale order and cannot be edited`,
      externalMessage:
        'Este lançamento foi gerado por um pedido de venda e não pode ser editado — só excluído ou restaurado.',
      context: SaleOrderLinkedEntryForbiddenError.name,
    });
  }
}
