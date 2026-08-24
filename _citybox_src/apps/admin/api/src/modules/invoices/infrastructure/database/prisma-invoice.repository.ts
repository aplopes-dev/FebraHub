import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { txClient } from '../../../../shared/infra/prisma/transaction.context';
import {
  InvoiceRepository,
  type InvoiceListCriteria,
  type TopDefaulter,
  type MonthlyRevenue,
  type InvoicesStats,
} from '../../domain/repositories/invoice.repository.interface';
import {
  Invoice,
  type InvoiceProps,
  type InvoiceStatus,
} from '../../domain/entities/invoice.entity';

@Injectable()
export class PrismaInvoiceRepository extends InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            tradeName: true,
            responsibleName: true,
            document: true,
          },
        },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria?: InvoiceListCriteria): Promise<Invoice[]> {
    const rows = await this.prisma.invoice.findMany({
      where: this.buildWhere(criteria),
      skip: criteria?.skip,
      take: criteria?.take,
      orderBy: { dueDate: 'asc' },
      include: {
        store: {
          select: {
            tradeName: true,
            responsibleName: true,
            document: true,
          },
        },
      },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(criteria?: InvoiceListCriteria): Promise<number> {
    return this.prisma.invoice.count({
      where: this.buildWhere(criteria),
    });
  }

  async sumAmountCents(criteria?: InvoiceListCriteria): Promise<number> {
    const aggregations = await this.prisma.invoice.aggregate({
      _sum: {
        amountCents: true,
      },
      where: this.buildWhere(criteria),
    });
    return aggregations._sum.amountCents ?? 0;
  }

  async findLastInvoiceForSubscription(
    subscriptionId: string,
  ): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findFirst({
      where: { subscriptionId },
      orderBy: { periodEnd: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySubscriptionAndPeriod(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findFirst({
      where: {
        subscriptionId,
        periodStart,
        periodEnd,
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByGatewayPaymentId(
    gatewayPaymentId: string,
  ): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findUnique({
      where: { gatewayPaymentId },
      include: {
        store: {
          select: {
            tradeName: true,
            responsibleName: true,
            document: true,
          },
        },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const row = await txClient(this.prisma).invoice.upsert({
      where: { id: invoice.id },
      create: {
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        storeId: invoice.storeId,
        amountCents: invoice.amountCents,
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        method: invoice.method,
        gatewayPaymentId: invoice.gatewayPaymentId,
        invoiceUrl: invoice.invoiceUrl,
        notes: invoice.notes,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
      update: {
        subscriptionId: invoice.subscriptionId,
        storeId: invoice.storeId,
        amountCents: invoice.amountCents,
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        method: invoice.method,
        gatewayPaymentId: invoice.gatewayPaymentId,
        invoiceUrl: invoice.invoiceUrl,
        notes: invoice.notes,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        updatedAt: invoice.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private buildWhere(criteria?: InvoiceListCriteria): Prisma.InvoiceWhereInput {
    const conditions: Prisma.InvoiceWhereInput[] = [];

    if (criteria?.storeId) {
      conditions.push({ storeId: criteria.storeId });
    }

    if (criteria?.subscriptionId) {
      conditions.push({ subscriptionId: criteria.subscriptionId });
    }

    if (criteria?.status?.length) {
      conditions.push({ status: { in: criteria.status } });
    }

    if (criteria?.method?.length) {
      conditions.push({ method: { in: criteria.method } });
    }

    if (criteria?.search) {
      // A busca era pelo nome do cliente; agora cobre os dois nomes da loja, porque o
      // operador digita tanto a razão social/responsável quanto o nome fantasia.
      conditions.push({
        store: {
          OR: [
            {
              responsibleName: {
                contains: criteria.search,
                mode: 'insensitive',
              },
            },
            { tradeName: { contains: criteria.search, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (criteria?.dueDateFrom) {
      conditions.push({ dueDate: { gte: criteria.dueDateFrom } });
    }

    if (criteria?.dueDateTo) {
      conditions.push({ dueDate: { lte: criteria.dueDateTo } });
    }

    if (!conditions.length) return {};
    return { AND: conditions };
  }

  private toEntity(
    row: {
      id: string;
      subscriptionId: string;
      storeId: string;
      amountCents: number;
      currency: string;
      status: string;
      dueDate: Date;
      paidAt: Date | null;
      method: string | null;
      gatewayPaymentId: string | null;
      invoiceUrl: string | null;
      notes: string | null;
      periodStart: Date;
      periodEnd: Date;
      createdAt: Date;
      updatedAt: Date;
    } & {
      store?: {
        tradeName: string;
        responsibleName: string | null;
        document: string | null;
      } | null;
    },
  ): Invoice {
    const props: InvoiceProps = {
      subscriptionId: row.subscriptionId,
      storeId: row.storeId,
      amountCents: row.amountCents,
      currency: row.currency,
      status: row.status as InvoiceStatus,
      dueDate: row.dueDate,
      paidAt: row.paidAt,
      method: row.method,
      gatewayPaymentId: row.gatewayPaymentId,
      invoiceUrl: row.invoiceUrl,
      notes: row.notes,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // "Cliente" exibido = a própria loja (PLAT-001).
      clientName: row.store?.responsibleName ?? row.store?.tradeName,
      clientDocument: row.store?.document ?? undefined,
    };
    return Invoice.with(props, row.id);
  }

  async getTopDefaulters(
    limit: number = 3,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopDefaulter[]> {
    const where: Prisma.InvoiceWhereInput = { status: 'PAST_DUE' };
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = startDate;
      if (endDate) where.dueDate.lte = endDate;
    }

    // Agrupa por LOJA (era por cliente até a Fase 10). O filtro que descartava faturas
    // sem cliente sumiu junto: toda fatura tem loja, então nenhuma inadimplência fica
    // invisível no ranking — que era o efeito do TODO antigo.
    const groups = await this.prisma.invoice.groupBy({
      by: ['storeId'],
      where,
      _sum: {
        amountCents: true,
      },
      orderBy: {
        _sum: {
          amountCents: 'desc',
        },
      },
      take: limit,
    });

    if (!groups.length) return [];

    const storeIds = groups.map((g) => g.storeId);
    const stores = await this.prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: {
        id: true,
        tradeName: true,
        responsibleName: true,
        document: true,
      },
    });

    const oldestInvoices = await this.prisma.invoice.groupBy({
      by: ['storeId'],
      where: {
        storeId: { in: storeIds },
        status: 'PAST_DUE',
        ...(startDate || endDate
          ? {
              dueDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      _min: {
        dueDate: true,
      },
    });

    const now = new Date();
    return groups.map((g) => {
      const store = stores.find((s) => s.id === g.storeId);
      const oldest = oldestInvoices.find((o) => o.storeId === g.storeId);

      const oldestDueDate = oldest?._min?.dueDate;
      let daysOverdue = 0;
      if (oldestDueDate) {
        const diffTime = Math.max(0, now.getTime() - oldestDueDate.getTime());
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        clientId: g.storeId,
        clientName:
          store?.responsibleName ?? store?.tradeName ?? 'Loja desconhecida',
        clientDocument: store?.document ?? '',
        amountCents: g._sum.amountCents ?? 0,
        daysOverdue,
      };
    });
  }

  async getMonthlyRevenueHistory(
    startDate: Date,
    endDate: Date,
  ): Promise<MonthlyRevenue[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['OPEN', 'PAID', 'PAST_DUE'] },
      },
      select: {
        amountCents: true,
        status: true,
        dueDate: true,
      },
    });

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
      const date = new Date(inv.dueDate);
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
    const groups = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: this.buildWhere(criteria),
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    let pendingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let openTotalCents = 0;
    let paidTotalCents = 0;

    for (const group of groups) {
      const count = group._count.id ?? 0;
      const sum = group._sum.amountCents ?? 0;

      if (group.status === 'OPEN') {
        pendingCount = count;
        openTotalCents += sum;
      } else if (group.status === 'PAST_DUE') {
        overdueCount = count;
        openTotalCents += sum;
      } else if (group.status === 'PAID') {
        paidCount = count;
        paidTotalCents = sum;
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
