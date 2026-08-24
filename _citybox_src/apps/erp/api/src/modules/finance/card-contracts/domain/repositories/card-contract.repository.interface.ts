import type { CardContract } from '../entities/card-contract.entity';

export const CARD_CONTRACT_LIST_TABS = ['active', 'deleted'] as const;
export type CardContractListTab = (typeof CARD_CONTRACT_LIST_TABS)[number];

export type CardContractListCriteria = {
  /** Busca por operadora (`provider`). */
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos. Um booleano `includeDeleted` não daria conta: a aba "Excluídos"
   * precisa dos excluídos **sozinhos**, não somados aos ativos.
   */
  tab?: CardContractListTab;
  skip?: number;
  take?: number;
};

export type CardContractTabCounts = Record<CardContractListTab, number>;

/**
 * O contrato sempre viaja com a contagem de formas de pagamento: a tela mostra
 * essa coluna em toda resposta, e buscá-la depois viraria N+1.
 */
export type CardContractWithPaymentMethodCount = {
  contract: CardContract;
  paymentMethodCount: number;
};

export abstract class CardContractRepository {
  /** Devolve também o excluído — a aba "Excluídos" leva até o detalhe dele. */
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<CardContractWithPaymentMethodCount | null>;

  abstract findAll(
    organizationId: string,
    criteria?: CardContractListCriteria,
  ): Promise<CardContractWithPaymentMethodCount[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<CardContractListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores das abas — ignoram a busca de propósito. */
  abstract countByTabs(organizationId: string): Promise<CardContractTabCounts>;

  abstract save(contract: CardContract): Promise<CardContract>;

  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;
}
