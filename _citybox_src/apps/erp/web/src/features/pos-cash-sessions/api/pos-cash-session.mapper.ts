import type {
  PosCashClosingReportDto,
  PosCashMovementDto,
  PosCashSaleDto,
  PosCashSessionDto,
} from "@/features/pos-cash-sessions/api/pos-cash-session.dto";
import type {
  PosCashClosingReport,
  PosCashMovement,
  PosCashSale,
  PosCashSession,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

export function toPosCashSession(dto: PosCashSessionDto): PosCashSession {
  return {
    id: dto.id,
    posRegisterId: dto.posTerminalId,
    posRegisterName: dto.posTerminalName?.trim() || "—",
    cashBoxLabel: "—",
    openedAt: dto.openedAt,
    closedAt: dto.closedAt,
    sellerName: "—",
    operatorName: dto.openedByName,
    openingBalanceCents: dto.openingFloatCents,
    closingBalanceCents: dto.countedCashCents,
    declaredReceiptsCents: dto.declaredReceiptsCents ?? 0,
    salesCount: dto.salesCount ?? 0,
    withdrawalCount: dto.withdrawalCount ?? 0,
  };
}

export function toPosCashMovement(dto: PosCashMovementDto): PosCashMovement {
  return {
    id: dto.id,
    sessionId: dto.sessionId,
    type: dto.type,
    amountCents: dto.amountCents,
    reason: dto.reason?.trim() || "—",
    operatorName: dto.operatorName,
    authorizedByName: dto.authorizedByName,
    at: dto.createdAt,
  };
}

export function toPosCashSale(dto: PosCashSaleDto): PosCashSale {
  const statusLabel =
    dto.status === "cancelled"
      ? "Cancelada"
      : dto.status === "closed"
        ? "Venda"
        : (dto.status ?? "Venda");
  return {
    id: dto.id,
    sessionId: dto.sessionId,
    number: dto.number ?? 0,
    customerName: dto.customerName || "Consumidor Final",
    sellerName: dto.sellerName?.trim() || "—",
    operatorName: dto.operatorName?.trim() || "—",
    startedAt: dto.startedAt,
    endedAt: dto.endedAt,
    amountCents: dto.amountCents,
    paymentMethod: dto.paymentMethod || "—",
    statusLabel,
    products: dto.products.map((product) => ({
      id: product.id,
      productName: product.productName,
      quantity: product.quantity,
      unitPriceCents: product.unitPriceCents,
      totalCents: product.totalCents,
    })),
    payments: dto.payments.map((payment) => ({
      id: payment.id,
      paidAt: payment.paidAt,
      method: payment.method,
      amountCents: payment.amountCents,
    })),
  };
}

export function toPosCashClosingReport(
  dto: PosCashClosingReportDto,
): PosCashClosingReport {
  return {
    sessionId: dto.sessionId,
    posRegisterName: dto.posRegisterName,
    cashBoxLabel: dto.cashBoxLabel || "—",
    openedAt: dto.openedAt,
    closedAt: dto.closedAt,
    openingBalanceCents: dto.openingBalanceCents,
    closingBalanceCents: dto.closingBalanceCents,
    salesCount: dto.salesCount,
    canceledSalesCount: dto.canceledSalesCount,
    informedTotalCents: dto.informedTotalCents,
    methods: dto.methods.map((row) => ({
      method: row.method,
      informedCents: row.informedCents,
      registeredCents: row.registeredCents,
    })),
  };
}
