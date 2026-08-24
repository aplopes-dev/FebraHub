import type { PaymentMethod } from '../entities/payment-method.entity';

export const PAYMENT_METHOD_LIST_TABS = ['active', 'deleted'] as const;
export type PaymentMethodListTab = (typeof PAYMENT_METHOD_LIST_TABS)[number];

export type PaymentMethodListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos — mesmo padrão de `CostCenterListCriteria` (um booleano
   * `includeDeleted` não daria conta: a aba "Excluídos" precisa dos excluídos
   * **sozinhos**, não somados aos ativos).
   */
  tab?: PaymentMethodListTab;
  skip?: number;
  take?: number;
};

export type PaymentMethodTabCounts = Record<PaymentMethodListTab, number>;

export abstract class PaymentMethodRepository {
  /** Devolve também o excluído — a aba "Excluídos" leva até o detalhe dele. */
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PaymentMethod | null>;

  /** Só entre os ativos: o nome de um excluído está livre para reutilização. */
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<PaymentMethod | null>;

  abstract findAll(
    organizationId: string,
    criteria?: PaymentMethodListCriteria,
  ): Promise<PaymentMethod[]>;

  /** Lote por id — usado pela emissão de NF-e (spec erp/029) para resolver o
   * `fiscalCode` de todas as formas de um pedido numa única consulta, em vez
   * de N `findById`. Inclui os excluídos (mesmo motivo de `findById`: um
   * pagamento já feito pode apontar para uma forma removida depois). */
  abstract findByIds(
    organizationId: string,
    ids: string[],
  ): Promise<PaymentMethod[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<PaymentMethodListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores das abas — ignoram a busca de propósito. */
  abstract countByTabs(organizationId: string): Promise<PaymentMethodTabCounts>;

  /** Se existe algum `FinancialEntryPayment` usando esta forma (FR-021). */
  abstract countUsage(organizationId: string, id: string): Promise<number>;

  abstract save(paymentMethod: PaymentMethod): Promise<PaymentMethod>;

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
