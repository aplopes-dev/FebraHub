import type { FinancialEntry } from '../entities/financial-entry.entity';
import type {
  FinancialEntryStatus,
  FinancialEntryType,
} from '../entities/financial-entry.entity';

export type FinancialEntryListSortBy =
  | 'dueDate'
  | 'description'
  | 'valueCents'
  | 'status';

export type FinancialEntryDateField = 'dueDate' | 'paidAt';

export type FinancialEntryListCriteria = {
  skip: number;
  take: number;
  startDate?: string;
  endDate?: string;
  /** Campo usado por `startDate`/`endDate`. Default: `dueDate`. */
  dateField?: FinancialEntryDateField;
  /** Filtro adicional no `paidAt` (ex.: agendadas = paidAt >= amanhã). */
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: FinancialEntryType[];
  statuses?: FinancialEntryStatus[];
  accountIds?: string[];
  paymentMethods?: string[];
  categoryIds?: string[];
  clientId?: string;
  search?: string;
  sortBy?: FinancialEntryListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type FinancialEntryByPaymentMethodCriteria = {
  startDate?: string;
  endDate?: string;
  dateField?: FinancialEntryDateField;
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: FinancialEntryType[];
  accountIds?: string[];
  paymentMethods?: string[];
};

export type FinancialEntryByPaymentMethodRow = {
  paymentMethod: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type FinancialEntryStatsCriteria = {
  startDate?: string;
  endDate?: string;
};

export type FinancialEntryStats = {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
};

export type FinancialEntryAccountRef = { id: string; name: string };
export type FinancialEntryCategoryRef = {
  id: string;
  name: string;
  color: string;
};
export type FinancialEntryClientRef = {
  id: string;
  name: string;
  phone: string | null;
};

export type FinancialEntryLoaded = {
  entry: FinancialEntry;
  account: FinancialEntryAccountRef | null;
  expenseCategory: FinancialEntryCategoryRef | null;
  incomeCategory: FinancialEntryCategoryRef | null;
  client: FinancialEntryClientRef | null;
};

export type CashflowDashboardListItem = {
  id: string;
  type: FinancialEntryType;
  dueDate: Date;
  paidAt: Date | null;
  valueCents: number;
  paidValueCents: number | null;
};

/** Métricas diárias do Ticket médio (agregadas por dia civil UTC de paidAt). */
export type TicketMedioDayMetricRow = {
  dateKey: string;
  revenueCents: number;
  expenseCents: number;
  /** Clientes distintos do dia (incomes com clientId). */
  clientIds: string[];
};

/** Débitos do card Inadimplência (income de clientes inadimplentes agora). */
export type InadimplenciaDashboardDebtRow = {
  id: string;
  dueDate: Date;
  description: string;
  valueCents: number;
  status: 'pending' | 'received';
  clientId: string;
  clientName: string;
  phone: string | null;
};

/** Linhas agregáveis do card Despesa por categoria. */
export type ExpenseByCategoryAggRow = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  amountCents: number;
};

export abstract class FinancialEntryRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<FinancialEntryLoaded | null>;

  abstract findMany(
    storeId: string,
    criteria: FinancialEntryListCriteria,
  ): Promise<FinancialEntryLoaded[]>;

  abstract count(
    storeId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract computeStats(
    storeId: string,
    criteria: FinancialEntryStatsCriteria,
  ): Promise<FinancialEntryStats>;

  /**
   * Soma `valueCents` de receitas `pending` com `dueDate` anterior a `todayIsoDate`
   * (`yyyy-MM-dd`, alinhado a `FinancialEntry.isOverdue`).
   */
  abstract sumOverdueIncomeCents(
    storeId: string,
    todayIsoDate: string,
  ): Promise<number>;

  abstract aggregateByPaymentMethod(
    storeId: string,
    criteria: FinancialEntryByPaymentMethodCriteria,
  ): Promise<FinancialEntryByPaymentMethodRow[]>;

  abstract save(entry: FinancialEntry): Promise<FinancialEntry>;

  abstract saveMany(entries: FinancialEntry[]): Promise<FinancialEntry[]>;

  abstract delete(storeId: string, id: string): Promise<void>;

  abstract findByRecurrenceGroup(
    storeId: string,
    groupId: string,
  ): Promise<FinancialEntry[]>;

  abstract existsByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<boolean>;

  abstract findByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<FinancialEntry | null>;

  /**
   * Income entries with status=received and paidAt in [startIsoDate, endIsoDate]
   * (inclusive civil dates), with client name.
   */
  abstract listReceivedIncomeInPaidAtRange(
    storeId: string,
    startIsoDate: string,
    endIsoDate: string,
  ): Promise<FinancialEntryLoaded[]>;

  abstract listEntriesForCashflowInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<CashflowDashboardListItem[]>;

  abstract listCashflowYears(storeId: string): Promise<number[]>;

  /**
   * Ticket médio: income received + expense paid por paidAt no range,
   * excluindo cancelled e paidAt > todayKey (civil UTC).
   */
  abstract listTicketMedioDayMetricsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<TicketMedioDayMetricRow[]>;

  /** Anos distintos de paidAt (income received + expense paid, não cancelados). */
  abstract listTicketMedioYears(storeId: string): Promise<number[]>;

  /**
   * Inadimplência: incomes pending|received com cliente e dueDate no range,
   * apenas de clientes que hoje têm overdue (pending + dueDate < todayKey).
   */
  abstract listInadimplenciaDebtsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<InadimplenciaDashboardDebtRow[]>;

  /** Anos distintos de dueDate (income pending|received com cliente). */
  abstract listInadimplenciaYears(storeId: string): Promise<number[]>;

  /**
   * Despesa por categoria: expense paid com paidAt no range;
   * amount = paidValueCents ?? valueCents; categoria via join.
   */
  abstract listExpenseByCategoryInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<ExpenseByCategoryAggRow[]>;

  /** Anos distintos de paidAt (expense paid). */
  abstract listExpenseByCategoryYears(storeId: string): Promise<number[]>;
}
