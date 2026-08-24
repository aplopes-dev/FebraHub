import {
  InvoiceRepository,
  type InvoiceListCriteria,
  type TopDefaulter,
  type MonthlyRevenue,
  type InvoicesStats,
} from '../domain/repositories/invoice.repository.interface';
import type { Invoice } from '../domain/entities/invoice.entity';

export class InMemoryInvoiceRepository extends InvoiceRepository {
  public items: Invoice[] = [];

  async findById(id: string): Promise<Invoice | null> {
    const item = this.items.find((i) => i.id === id);
    return item ?? null;
  }

  async findAll(criteria?: InvoiceListCriteria): Promise<Invoice[]> {
    let result = this.items;

    if (criteria?.storeId) {
      result = result.filter((i) => i.storeId === criteria.storeId);
    }

    if (criteria?.subscriptionId) {
      result = result.filter(
        (i) => i.subscriptionId === criteria.subscriptionId,
      );
    }

    if (criteria?.status?.length) {
      result = result.filter((i) => criteria.status!.includes(i.status));
    }

    if (criteria?.method?.length) {
      result = result.filter(
        (i) => i.method && criteria.method!.includes(i.method),
      );
    }

    if (criteria?.search) {
      const searchLower = criteria.search.toLowerCase();
      result = result.filter(
        (i) => i.clientName && i.clientName.toLowerCase().includes(searchLower),
      );
    }

    if (criteria?.dueDateFrom) {
      result = result.filter((i) => i.dueDate >= criteria.dueDateFrom!);
    }

    if (criteria?.dueDateTo) {
      result = result.filter((i) => i.dueDate <= criteria.dueDateTo!);
    }

    // Sort by dueDate asc
    result = [...result].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

    if (criteria?.skip !== undefined) {
      result = result.slice(criteria.skip);
    }

    if (criteria?.take !== undefined) {
      result = result.slice(0, criteria.take);
    }

    return result;
  }

  async count(criteria?: InvoiceListCriteria): Promise<number> {
    const items = await this.findAll({
      subscriptionId: criteria?.subscriptionId,
      status: criteria?.status,
      dueDateFrom: criteria?.dueDateFrom,
      dueDateTo: criteria?.dueDateTo,
    });
    return items.length;
  }

  async sumAmountCents(criteria?: InvoiceListCriteria): Promise<number> {
    const items = await this.findAll({
      subscriptionId: criteria?.subscriptionId,
      status: criteria?.status,
      dueDateFrom: criteria?.dueDateFrom,
      dueDateTo: criteria?.dueDateTo,
    });
    return items.reduce((acc, curr) => acc + curr.amountCents, 0);
  }

  async findLastInvoiceForSubscription(
    subscriptionId: string,
  ): Promise<Invoice | null> {
    const matches = this.items
      .filter((i) => i.subscriptionId === subscriptionId)
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime());
    return matches[0] ?? null;
  }

  async findBySubscriptionAndPeriod(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Invoice | null> {
    const match = this.items.find(
      (i) =>
        i.subscriptionId === subscriptionId &&
        i.periodStart.getTime() === periodStart.getTime() &&
        i.periodEnd.getTime() === periodEnd.getTime(),
    );
    return match ?? null;
  }

  async findByGatewayPaymentId(
    gatewayPaymentId: string,
  ): Promise<Invoice | null> {
    const match = this.items.find(
      (i) => i.gatewayPaymentId === gatewayPaymentId,
    );
    return match ?? null;
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const index = this.items.findIndex((i) => i.id === invoice.id);
    if (index >= 0) {
      this.items[index] = invoice;
    } else {
      this.items.push(invoice);
    }
    return invoice;
  }

  async getTopDefaulters(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopDefaulter[]> {
    const pastDue = this.items.filter((i) => {
      if (i.status !== 'PAST_DUE') return false;
      if (startDate && i.dueDate < startDate) return false;
      if (endDate && i.dueDate > endDate) return false;
      return true;
    });
    const storeMap = new Map<
      string,
      {
        clientName: string;
        clientDocument: string;
        amountCents: number;
        oldestDueDate: Date;
      }
    >();

    for (const inv of pastDue) {
      // Espelha o repositório Prisma: ranking por LOJA desde a Fase 10 — nenhuma
      // fatura fica de fora, porque toda fatura tem loja.
      const existing = storeMap.get(inv.storeId);
      if (existing) {
        existing.amountCents += inv.amountCents;
        if (inv.dueDate < existing.oldestDueDate) {
          existing.oldestDueDate = inv.dueDate;
        }
      } else {
        storeMap.set(inv.storeId, {
          clientName: inv.clientName ?? 'Loja desconhecida',
          clientDocument: inv.clientDocument ?? '',
          amountCents: inv.amountCents,
          oldestDueDate: inv.dueDate,
        });
      }
    }

    const now = new Date();
    const result: TopDefaulter[] = Array.from(storeMap.entries()).map(
      ([storeId, value]) => {
        const diffTime = Math.max(
          0,
          now.getTime() - value.oldestDueDate.getTime(),
        );
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          clientId: storeId,
          clientName: value.clientName,
          clientDocument: value.clientDocument,
          amountCents: value.amountCents,
          daysOverdue,
        };
      },
    );

    return result.sort((a, b) => b.amountCents - a.amountCents).slice(0, limit);
  }

  async getMonthlyRevenueHistory(
    startDate: Date,
    endDate: Date,
  ): Promise<MonthlyRevenue[]> {
    const invoices = this.items.filter(
      (i) =>
        i.dueDate >= startDate &&
        i.dueDate <= endDate &&
        ['OPEN', 'PAID', 'PAST_DUE'].includes(i.status),
    );

    const monthlyMap = new Map<
      string,
      { expectedCents: number; realizedCents: number }
    >();

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { expectedCents: 0, realizedCents: 0 });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    for (const inv of invoices) {
      const date = inv.dueDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthly = monthlyMap.get(key);
      if (monthly) {
        monthly.expectedCents += inv.amountCents;
        if (inv.status === 'PAID') {
          monthly.realizedCents += inv.amountCents;
        }
      }
    }

    const history: MonthlyRevenue[] = [];
    monthlyMap.forEach((val, key) => {
      history.push({
        month: key,
        expectedCents: val.expectedCents,
        realizedCents: val.realizedCents,
      });
    });

    return history.sort((a, b) => a.month.localeCompare(b.month));
  }

  async getStats(criteria?: InvoiceListCriteria): Promise<InvoicesStats> {
    const cleanCriteria = { ...criteria, skip: undefined, take: undefined };
    const items = await this.findAll(cleanCriteria);

    let pendingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let openTotalCents = 0;
    let paidTotalCents = 0;

    for (const item of items) {
      if (item.status === 'OPEN') {
        pendingCount++;
        openTotalCents += item.amountCents;
      } else if (item.status === 'PAST_DUE') {
        overdueCount++;
        openTotalCents += item.amountCents;
      } else if (item.status === 'PAID') {
        paidCount++;
        paidTotalCents += item.amountCents;
      }
    }

    const totalCount = pendingCount + overdueCount + paidCount;
    const delinquencyRate =
      totalCount > 0 ? Math.round((overdueCount / totalCount) * 100) : 0;

    return {
      openTotalCents,
      paidTotalCents,
      pendingCount,
      overdueCount,
      paidCount,
      totalCount,
      delinquencyRate,
    };
  }
}
