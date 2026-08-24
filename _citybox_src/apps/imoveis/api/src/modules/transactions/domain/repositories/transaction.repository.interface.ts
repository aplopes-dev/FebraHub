import type {
  CommissionSplit,
  RentalConfig,
  RentalPayoutStatus,
  SplitSource,
  TransactionEntity,
  TransactionPaymentMethod,
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';

export type ListTransactionsFilters = {
  page: number;
  perPage: number;
  search?: string;
  type?: TransactionType[];
  status?: TransactionStatus[];
  /** Casa com `captorId` **ou** `sellerId`. */
  agentId?: string;
  /** Início inclusivo do dia civil (instant) sobre `createdAt`. */
  periodFrom?: Date;
  /** Fim exclusivo do dia civil (instant) sobre `createdAt`. */
  periodToExclusive?: Date;
};

export type ListTransactionsResult = {
  items: TransactionEntity[];
  total: number;
};

/** Entrada de histórico; `at` é date-only (`YYYY-MM-DD`). */
export type TransactionActivityInput = {
  at: string;
  actorName: string;
  message: string;
};

export type CreateTransactionPayload = {
  storeId: string;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  propertyId: string | null;
  propertyName: string;
  leadId: string | null;
  leadName: string | null;
  dealId?: string | null;
  captorId: string;
  sellerId: string | null;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  commissionPercent: number;
  split: CommissionSplit;
  splitSource: SplitSource;
  rental: RentalConfig | null;
  activity: TransactionActivityInput;
};

export type UpdateSplitPayload = {
  commissionPercent: number;
  split: CommissionSplit;
  splitSource: SplitSource;
};

export type UpdateRentalPayoutPayload = {
  status: RentalPayoutStatus;
  /** date-only (`YYYY-MM-DD`) ou `null` quando ainda não ocorreu. */
  paidAt: string | null;
  payoutAt: string | null;
};

export type UpdateTransactionStatusPayload = {
  status: TransactionStatus;
};

/** Teto de linhas carregadas para agregações (financeiro e relatórios). */
export const TRANSACTIONS_AGGREGATE_CAP = 2000;

export abstract class TransactionRepository {
  abstract findMany(
    storeId: string,
    filters: ListTransactionsFilters,
  ): Promise<ListTransactionsResult>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<TransactionEntity | null>;

  abstract findByDealId(
    storeId: string,
    dealId: string,
  ): Promise<TransactionEntity | null>;

  /** Propostas/contratos abertos no imóvel (reserva). */
  abstract findOpenByPropertyId(
    storeId: string,
    propertyId: string,
  ): Promise<TransactionEntity[]>;

  /** Mapa dealId → transactionId para enriquecer listagens do funil. */
  abstract findTransactionIdsByDealIds(
    storeId: string,
    dealIds: readonly string[],
  ): Promise<Map<string, string>>;

  /**
   * Fallback: negócio sem `deal_id` na transação — usa lead ativo.
   * Retorna leadId → transactionId (mais recente não cancelada).
   */
  abstract findTransactionIdsByLeadIds(
    storeId: string,
    leadIds: readonly string[],
  ): Promise<Map<string, string>>;

  /** Transações que ainda “prendem” o imóvel, exceto a informada. */
  abstract countActiveTransactionsByPropertyId(
    storeId: string,
    propertyId: string,
    excludeTransactionId: string,
    statuses?: readonly TransactionStatus[],
  ): Promise<number>;

  /** Todas as transações da loja (limitado a `TRANSACTIONS_AGGREGATE_CAP`). */
  abstract findAllForStore(storeId: string): Promise<TransactionEntity[]>;

  abstract create(
    payload: CreateTransactionPayload,
  ): Promise<TransactionEntity>;

  abstract updateSplit(
    storeId: string,
    id: string,
    payload: UpdateSplitPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null>;

  abstract updateRentalPayout(
    storeId: string,
    id: string,
    payload: UpdateRentalPayoutPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null>;

  abstract updateStatus(
    storeId: string,
    id: string,
    payload: UpdateTransactionStatusPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null>;
}
