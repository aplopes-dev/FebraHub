import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { isCashPaymentMethod } from '../../domain/cash-expected';
import {
  PosCashMovement,
  type PosCashMovementProps,
  type PosCashMovementType,
} from '../../domain/entities/pos-cash-movement.entity';
import {
  PosCashSession,
  type PosCashSessionProps,
  type PosCashSessionStatus,
} from '../../domain/entities/pos-cash-session.entity';
import {
  PosCashSessionRepository,
  type ClosingReport,
  type ListCashSessionsCriteria,
  type ListCashSessionsResult,
  type ListSessionSalesResult,
  type SessionSale,
} from '../../domain/repositories/pos-cash-session.repository.interface';

type SessionRow = {
  id: string;
  organizationId: string;
  branchId: string;
  posTerminalId: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  openedByUserId: string;
  openedByName: string;
  openingFloatCents: number;
  countedCashCents: number | null;
  countedCreditCents: number | null;
  countedDebitCents: number | null;
  countedVoucherCents: number | null;
  countedOtherCents: number | null;
  expectedCashCents: number | null;
  differenceCashCents: number | null;
  declaredReceiptsCents: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type MovementRow = {
  id: string;
  organizationId: string;
  sessionId: string;
  type: string;
  amountCents: number;
  reason: string;
  operation: string;
  operatorUserId: string;
  operatorName: string;
  authorizedByUserId: string | null;
  authorizedByName: string | null;
  createdAt: Date;
};

@Injectable()
export class PrismaPosCashSessionRepository extends PosCashSessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PosCashSession | null> {
    const row = await this.prisma.scoped.posCashSession.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toSession(row) : null;
  }

  async findOpenByTerminal(
    organizationId: string,
    posTerminalId: string,
  ): Promise<PosCashSession | null> {
    const row = await this.prisma.scoped.posCashSession.findFirst({
      where: { organizationId, posTerminalId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });
    return row ? this.toSession(row) : null;
  }

  async save(session: PosCashSession): Promise<PosCashSession> {
    const data = {
      organizationId: session.organizationId,
      branchId: session.branchId,
      posTerminalId: session.posTerminalId,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openedByUserId: session.openedByUserId,
      openedByName: session.openedByName,
      openingFloatCents: session.openingFloatCents,
      countedCashCents: session.countedCashCents,
      countedCreditCents: session.countedCreditCents,
      countedDebitCents: session.countedDebitCents,
      countedVoucherCents: session.countedVoucherCents,
      countedOtherCents: session.countedOtherCents,
      expectedCashCents: session.expectedCashCents,
      differenceCashCents: session.differenceCashCents,
      declaredReceiptsCents: session.declaredReceiptsCents,
      updatedAt: session.updatedAt,
    };

    const row = await this.prisma.scoped.posCashSession.upsert({
      where: { id: session.id },
      create: { id: session.id, ...data, createdAt: session.createdAt },
      update: data,
    });

    return this.toSession(row);
  }

  async addMovement(movement: PosCashMovement): Promise<PosCashMovement> {
    const row = await this.prisma.scoped.posCashMovement.create({
      data: {
        id: movement.id,
        organizationId: movement.organizationId,
        sessionId: movement.sessionId,
        type: movement.type,
        amountCents: movement.amountCents,
        reason: movement.reason,
        operation: movement.operation,
        operatorUserId: movement.operatorUserId,
        operatorName: movement.operatorName,
        authorizedByUserId: movement.authorizedByUserId,
        authorizedByName: movement.authorizedByName,
        createdAt: movement.createdAt,
      },
    });
    return this.toMovement(row);
  }

  async listMovements(
    organizationId: string,
    sessionId: string,
  ): Promise<PosCashMovement[]> {
    const rows = await this.prisma.scoped.posCashMovement.findMany({
      where: { organizationId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return (rows as MovementRow[]).map((row) => this.toMovement(row));
  }

  async listSessions(
    criteria: ListCashSessionsCriteria,
  ): Promise<ListCashSessionsResult> {
    const where = {
      organizationId: criteria.organizationId,
      ...(criteria.posTerminalId
        ? { posTerminalId: criteria.posTerminalId }
        : {}),
      ...(criteria.operatorName
        ? {
            openedByName: {
              contains: criteria.operatorName,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(criteria.openedFrom || criteria.openedTo
        ? {
            openedAt: {
              ...(criteria.openedFrom ? { gte: criteria.openedFrom } : {}),
              ...(criteria.openedTo ? { lte: criteria.openedTo } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.scoped.posCashSession.count({ where }),
      this.prisma.scoped.posCashSession.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (criteria.page - 1) * criteria.perPage,
        take: criteria.perPage,
        include: {
          posTerminal: { select: { name: true } },
          _count: {
            select: {
              saleOrders: true,
              movements: { where: { type: 'withdrawal' } },
            },
          },
        },
      }),
    ]);

    return {
      total,
      items: rows.map((row) => {
        const sessionRow = row as SessionRow & {
          posTerminal: { name: string };
          _count: { saleOrders: number; movements: number };
        };
        return {
          session: this.toSession(sessionRow),
          posTerminalName: sessionRow.posTerminal.name,
          salesCount: sessionRow._count.saleOrders,
          withdrawalCount: sessionRow._count.movements,
        };
      }),
    };
  }

  async sumCashPaymentsCents(
    organizationId: string,
    sessionId: string,
  ): Promise<number> {
    const payments = await this.prisma.scoped.saleOrderPayment.findMany({
      where: {
        organizationId,
        saleOrder: {
          cashSessionId: sessionId,
          status: 'closed',
          deletedAt: null,
        },
      },
      include: {
        // PaymentMethod is not a relation on SaleOrderPayment — methodId is loose string.
      },
    });

    if (payments.length === 0) return 0;

    const methodIds = [...new Set(payments.map((p) => p.methodId))];
    const methods = await this.prisma.scoped.paymentMethod.findMany({
      where: { organizationId, id: { in: methodIds } },
      select: { id: true, name: true, systemKey: true },
    });
    const byId = new Map(methods.map((m) => [m.id, m]));

    let total = 0;
    for (const payment of payments) {
      const method = byId.get(payment.methodId);
      if (
        isCashPaymentMethod(method?.systemKey ?? null, method?.name ?? null)
      ) {
        total += payment.amountCents;
      }
    }
    return total;
  }

  async sumMovementsByType(
    organizationId: string,
    sessionId: string,
  ): Promise<{ reinforcementCents: number; withdrawalCents: number }> {
    const grouped = await this.prisma.scoped.posCashMovement.groupBy({
      by: ['type'],
      where: { organizationId, sessionId },
      _sum: { amountCents: true },
    });

    let reinforcementCents = 0;
    let withdrawalCents = 0;
    for (const row of grouped) {
      const sum = row._sum.amountCents ?? 0;
      if (row.type === 'reinforcement') reinforcementCents = sum;
      if (row.type === 'withdrawal') withdrawalCents = sum;
    }
    return { reinforcementCents, withdrawalCents };
  }

  async listSessionSales(
    organizationId: string,
    sessionId: string,
    page: number,
    perPage: number,
  ): Promise<ListSessionSalesResult> {
    const where = {
      organizationId,
      cashSessionId: sessionId,
      deletedAt: null,
    };
    const [total, rows] = await Promise.all([
      this.prisma.scoped.saleOrder.count({ where }),
      this.prisma.scoped.saleOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          lines: {
            include: { product: { select: { name: true } } },
          },
          payments: true,
        },
      }),
    ]);

    const methodIds = [
      ...new Set(rows.flatMap((sale) => sale.payments.map((p) => p.methodId))),
    ];
    const methods =
      methodIds.length === 0
        ? []
        : await this.prisma.scoped.paymentMethod.findMany({
            where: { organizationId, id: { in: methodIds } },
            select: { id: true, name: true, systemKey: true },
          });
    const methodById = new Map(methods.map((m) => [m.id, m]));

    return {
      total,
      items: rows.map((sale) => this.toSessionSale(sale, methodById)),
    };
  }

  async findSessionSale(
    organizationId: string,
    sessionId: string,
    saleOrderId: string,
  ): Promise<SessionSale | null> {
    const sale = await this.prisma.scoped.saleOrder.findFirst({
      where: {
        organizationId,
        id: saleOrderId,
        cashSessionId: sessionId,
        deletedAt: null,
      },
      include: {
        lines: {
          include: { product: { select: { name: true } } },
        },
        payments: true,
      },
    });
    if (!sale) return null;

    const methodIds = [...new Set(sale.payments.map((p) => p.methodId))];
    const methods =
      methodIds.length === 0
        ? []
        : await this.prisma.scoped.paymentMethod.findMany({
            where: { organizationId, id: { in: methodIds } },
            select: { id: true, name: true, systemKey: true },
          });
    return this.toSessionSale(sale, new Map(methods.map((m) => [m.id, m])));
  }

  async getClosingReport(
    organizationId: string,
    sessionId: string,
  ): Promise<ClosingReport | null> {
    const sessionRow = await this.prisma.scoped.posCashSession.findFirst({
      where: { organizationId, id: sessionId },
      include: { posTerminal: { select: { name: true } } },
    });
    if (!sessionRow) return null;

    const sales = await this.prisma.scoped.saleOrder.findMany({
      where: { organizationId, cashSessionId: sessionId, deletedAt: null },
      include: { payments: true },
    });

    const methodIds = [
      ...new Set(sales.flatMap((sale) => sale.payments.map((p) => p.methodId))),
    ];
    const methods =
      methodIds.length === 0
        ? []
        : await this.prisma.scoped.paymentMethod.findMany({
            where: { organizationId, id: { in: methodIds } },
            select: { id: true, name: true, systemKey: true },
          });
    const methodById = new Map(methods.map((m) => [m.id, m]));

    const registered = new Map<
      string,
      { method: string; systemKey: string | null; registeredCents: number }
    >();
    let salesCount = 0;
    let canceledSalesCount = 0;
    for (const sale of sales) {
      if (sale.status === 'cancelled') {
        canceledSalesCount += 1;
        continue;
      }
      salesCount += 1;
      for (const payment of sale.payments) {
        const method = methodById.get(payment.methodId);
        const key = payment.methodId;
        const current = registered.get(key) ?? {
          method: method?.name ?? payment.methodId,
          systemKey: method?.systemKey ?? null,
          registeredCents: 0,
        };
        registered.set(key, {
          ...current,
          registeredCents: current.registeredCents + payment.amountCents,
        });
      }
    }

    const session = this.toSession(sessionRow);
    return {
      session,
      posTerminalName: (
        sessionRow as SessionRow & { posTerminal: { name: string } }
      ).posTerminal.name,
      salesCount,
      canceledSalesCount,
      methods: [...registered.values()].map((row) => ({
        method: row.method,
        systemKey: row.systemKey,
        registeredCents: row.registeredCents,
        informedCents: isCashPaymentMethod(row.systemKey, row.method)
          ? (session.countedCashCents ?? 0)
          : 0,
      })),
    };
  }

  private toSession(row: SessionRow): PosCashSession {
    const props: PosCashSessionProps = {
      organizationId: row.organizationId,
      branchId: row.branchId,
      posTerminalId: row.posTerminalId,
      status: row.status as PosCashSessionStatus,
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      openedByUserId: row.openedByUserId,
      openedByName: row.openedByName,
      openingFloatCents: row.openingFloatCents,
      countedCashCents: row.countedCashCents,
      countedCreditCents: row.countedCreditCents,
      countedDebitCents: row.countedDebitCents,
      countedVoucherCents: row.countedVoucherCents,
      countedOtherCents: row.countedOtherCents,
      expectedCashCents: row.expectedCashCents,
      differenceCashCents: row.differenceCashCents,
      declaredReceiptsCents: row.declaredReceiptsCents,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PosCashSession.with(props, row.id);
  }

  private toMovement(row: MovementRow): PosCashMovement {
    const props: PosCashMovementProps = {
      organizationId: row.organizationId,
      sessionId: row.sessionId,
      type: row.type as PosCashMovementType,
      amountCents: row.amountCents,
      reason: row.reason,
      operation: row.operation,
      operatorUserId: row.operatorUserId,
      operatorName: row.operatorName,
      authorizedByUserId: row.authorizedByUserId,
      authorizedByName: row.authorizedByName,
      createdAt: row.createdAt,
    };
    return PosCashMovement.with(props, row.id);
  }

  private toSessionSale(
    sale: {
      id: string;
      cashSessionId: string | null;
      number: number;
      customerName: string;
      sellerName: string;
      createdByName: string;
      status: string;
      totalCents: number;
      createdAt: Date;
      updatedAt: Date;
      lines: Array<{
        id: string;
        productId: string | null;
        description: string | null;
        quantity: { toString(): string } | string;
        unitPriceCents: number;
        product: { name: string } | null;
      }>;
      payments: Array<{
        id: string;
        methodId: string;
        amountCents: number;
      }>;
    },
    methodById: Map<
      string,
      { id: string; name: string; systemKey: string | null }
    >,
  ): SessionSale {
    return {
      id: sale.id,
      sessionId: sale.cashSessionId ?? '',
      number: sale.number,
      customerName: sale.customerName,
      sellerName: sale.sellerName,
      operatorName: sale.createdByName,
      status: sale.status,
      totalCents: sale.totalCents,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      lines: sale.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        // Linha de serviço (sem produto vinculado) usa `description` como
        // rótulo (spec erp/031 D1).
        productName: line.product?.name ?? line.description ?? '',
        quantity: line.quantity.toString(),
        unitPriceCents: line.unitPriceCents,
      })),
      payments: sale.payments.map((payment) => {
        const method = methodById.get(payment.methodId);
        return {
          id: payment.id,
          methodId: payment.methodId,
          methodName: method?.name ?? payment.methodId,
          methodSystemKey: method?.systemKey ?? null,
          amountCents: payment.amountCents,
          paidAt: sale.createdAt,
        };
      }),
    };
  }
}
