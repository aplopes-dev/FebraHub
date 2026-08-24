import type { PosCashMovement } from '../../../../domain/entities/pos-cash-movement.entity';
import type { PosCashSession } from '../../../../domain/entities/pos-cash-session.entity';
import type {
  ClosingReport,
  ListCashSessionsResult,
  ListSessionSalesResult,
  PosCashSessionListItem,
  SessionSale,
} from '../../../../domain/repositories/pos-cash-session.repository.interface';

export class PosCashSessionPresenter {
  static toHttpDetail(session: PosCashSession) {
    return {
      id: session.id,
      organizationId: session.organizationId,
      branchId: session.branchId,
      posTerminalId: session.posTerminalId,
      status: session.status,
      openedAt: session.openedAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
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
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  static toHttpListItem(item: PosCashSessionListItem) {
    return {
      ...PosCashSessionPresenter.toHttpDetail(item.session),
      posTerminalName: item.posTerminalName,
      salesCount: item.salesCount,
      withdrawalCount: item.withdrawalCount,
    };
  }

  static toHttpSingle(session: PosCashSession | null) {
    return {
      data: session ? PosCashSessionPresenter.toHttpDetail(session) : null,
    };
  }

  static toHttpList(result: ListCashSessionsResult) {
    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(result.total / Math.max(1, result.items.length || 1));
    // Prefer explicit page meta from caller — compute from items length is wrong.
    // Routes pass page/perPage separately.
    return {
      data: result.items.map((item) =>
        PosCashSessionPresenter.toHttpListItem(item),
      ),
      meta: {
        total: result.total,
      },
    };
  }

  static toHttpListWithMeta(
    result: ListCashSessionsResult,
    page: number,
    perPage: number,
  ) {
    return {
      data: result.items.map((item) =>
        PosCashSessionPresenter.toHttpListItem(item),
      ),
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages: Math.ceil(result.total / perPage) || 0,
      },
    };
  }

  static toHttpMovement(movement: PosCashMovement) {
    return {
      id: movement.id,
      sessionId: movement.sessionId,
      type: movement.type,
      amountCents: movement.amountCents,
      reason: movement.reason,
      operation: movement.operation,
      operatorUserId: movement.operatorUserId,
      operatorName: movement.operatorName,
      authorizedByUserId: movement.authorizedByUserId,
      authorizedByName: movement.authorizedByName,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  static toHttpMovements(movements: PosCashMovement[]) {
    return {
      data: movements.map((m) => PosCashSessionPresenter.toHttpMovement(m)),
    };
  }

  static toHttpSale(sale: SessionSale) {
    const primaryMethod = sale.payments[0]?.methodName ?? '';
    return {
      id: sale.id,
      sessionId: sale.sessionId,
      number: sale.number,
      customerName: sale.customerName,
      sellerName: sale.sellerName,
      operatorName: sale.operatorName,
      status: sale.status,
      amountCents: sale.totalCents,
      paymentMethod: primaryMethod,
      startedAt: sale.createdAt.toISOString(),
      endedAt: sale.updatedAt.toISOString(),
      products: sale.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        quantity: Number(line.quantity),
        unitPriceCents: line.unitPriceCents,
        totalCents: Math.round(Number(line.quantity) * line.unitPriceCents),
      })),
      payments: sale.payments.map((payment) => ({
        id: payment.id,
        paidAt: payment.paidAt.toISOString(),
        methodId: payment.methodId,
        method: payment.methodName,
        methodSystemKey: payment.methodSystemKey,
        amountCents: payment.amountCents,
      })),
    };
  }

  static toHttpSales(
    result: ListSessionSalesResult,
    page: number,
    perPage: number,
  ) {
    return {
      data: result.items.map((sale) =>
        PosCashSessionPresenter.toHttpSale(sale),
      ),
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages: Math.ceil(result.total / perPage) || 0,
      },
    };
  }

  static toHttpClosingReport(report: ClosingReport) {
    return {
      data: {
        sessionId: report.session.id,
        posRegisterName: report.posTerminalName,
        cashBoxLabel: report.session.openedByName,
        openedAt: report.session.openedAt.toISOString(),
        closedAt: report.session.closedAt?.toISOString() ?? null,
        openingBalanceCents: report.session.openingFloatCents,
        closingBalanceCents: report.session.countedCashCents,
        salesCount: report.salesCount,
        canceledSalesCount: report.canceledSalesCount,
        informedTotalCents: report.session.declaredReceiptsCents ?? 0,
        methods: report.methods.map((row) => ({
          method: row.method,
          informedCents: row.informedCents,
          registeredCents: row.registeredCents,
        })),
      },
    };
  }
}
