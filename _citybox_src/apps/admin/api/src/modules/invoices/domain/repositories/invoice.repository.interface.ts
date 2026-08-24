import type { Invoice, InvoiceStatus } from '../entities/invoice.entity';

export type InvoiceListCriteria = {
  skip?: number;
  take?: number;
  storeId?: string;
  subscriptionId?: string;
  status?: InvoiceStatus[];
  method?: string[];
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
};

/**
 * Ranking de inadimplência. Os campos mantêm o prefixo `client*` porque é assim que o
 * admin chama a loja desde o PLAT-001; `clientId` carrega o **id da loja**.
 */
export interface TopDefaulter {
  clientId: string;
  clientName: string;
  clientDocument: string;
  amountCents: number;
  daysOverdue: number;
}

export interface MonthlyRevenue {
  month: string;
  expectedCents: number;
  realizedCents: number;
}

export interface InvoicesStats {
  openTotalCents: number;
  paidTotalCents: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  totalCount: number;
  delinquencyRate: number;
}

export abstract class InvoiceRepository {
  abstract findById(id: string): Promise<Invoice | null>;
  abstract findAll(criteria?: InvoiceListCriteria): Promise<Invoice[]>;
  abstract count(criteria?: InvoiceListCriteria): Promise<number>;
  abstract sumAmountCents(criteria?: InvoiceListCriteria): Promise<number>;
  abstract findLastInvoiceForSubscription(
    subscriptionId: string,
  ): Promise<Invoice | null>;
  abstract findBySubscriptionAndPeriod(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Invoice | null>;
  abstract findByGatewayPaymentId(
    gatewayPaymentId: string,
  ): Promise<Invoice | null>;
  abstract save(invoice: Invoice): Promise<Invoice>;
  abstract getTopDefaulters(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopDefaulter[]>;
  abstract getMonthlyRevenueHistory(
    startDate: Date,
    endDate: Date,
  ): Promise<MonthlyRevenue[]>;
  abstract getStats(criteria?: InvoiceListCriteria): Promise<InvoicesStats>;
}
