import type { CardPaymentMethod } from '../entities/card-payment-method.entity';

export abstract class CardPaymentMethodRepository {
  abstract findById(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<CardPaymentMethod | null>;

  abstract findAllByContract(
    organizationId: string,
    cardContractId: string,
  ): Promise<CardPaymentMethod[]>;

  /**
   * Grava o método e **substitui** o conjunto de faixas na mesma transação —
   * salvar em duas chamadas abriria a janela em que o método já anuncia
   * progressivo apontando para as faixas antigas.
   */
  abstract save(method: CardPaymentMethod): Promise<CardPaymentMethod>;

  /** Hard delete: método e faixas somem juntos. */
  abstract delete(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<void>;
}
