import type { PosCashMovement } from '../entities/pos-cash-movement.entity';
import type { PosCashSession } from '../entities/pos-cash-session.entity';

export type ListCashSessionsCriteria = {
  organizationId: string;
  posTerminalId?: string;
  operatorName?: string;
  openedFrom?: Date;
  openedTo?: Date;
  page: number;
  perPage: number;
};

export type ListCashSessionsResult = {
  items: PosCashSessionListItem[];
  total: number;
};

/** Item enriquecido para listagem JWT (nomes de terminal + contagens). */
export type PosCashSessionListItem = {
  session: PosCashSession;
  posTerminalName: string;
  salesCount: number;
  withdrawalCount: number;
};

export type SessionSalePayment = {
  id: string;
  methodId: string;
  methodName: string;
  methodSystemKey: string | null;
  amountCents: number;
  paidAt: Date;
};

export type SessionSaleLine = {
  id: string;
  /** `null` = linha de serviço sem vínculo de catálogo (spec erp/031 D1) — usar `productName` como rótulo. */
  productId: string | null;
  productName: string;
  quantity: string;
  unitPriceCents: number;
};

export type SessionSale = {
  id: string;
  sessionId: string;
  number: number;
  customerName: string;
  sellerName: string;
  /** Quem digitou a venda no PDV (`SaleOrder.createdByName`). */
  operatorName: string;
  status: string;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
  lines: SessionSaleLine[];
  payments: SessionSalePayment[];
};

export type ListSessionSalesResult = {
  items: SessionSale[];
  total: number;
};

export type ClosingMethodRow = {
  method: string;
  systemKey: string | null;
  informedCents: number;
  registeredCents: number;
};

export type ClosingReport = {
  session: PosCashSession;
  posTerminalName: string;
  salesCount: number;
  canceledSalesCount: number;
  methods: ClosingMethodRow[];
};

export abstract class PosCashSessionRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PosCashSession | null>;

  abstract findOpenByTerminal(
    organizationId: string,
    posTerminalId: string,
  ): Promise<PosCashSession | null>;

  abstract save(session: PosCashSession): Promise<PosCashSession>;

  abstract addMovement(movement: PosCashMovement): Promise<PosCashMovement>;

  abstract listMovements(
    organizationId: string,
    sessionId: string,
  ): Promise<PosCashMovement[]>;

  abstract listSessions(
    criteria: ListCashSessionsCriteria,
  ): Promise<ListCashSessionsResult>;

  abstract sumCashPaymentsCents(
    organizationId: string,
    sessionId: string,
  ): Promise<number>;

  abstract sumMovementsByType(
    organizationId: string,
    sessionId: string,
  ): Promise<{ reinforcementCents: number; withdrawalCents: number }>;

  abstract listSessionSales(
    organizationId: string,
    sessionId: string,
    page: number,
    perPage: number,
  ): Promise<ListSessionSalesResult>;

  abstract findSessionSale(
    organizationId: string,
    sessionId: string,
    saleOrderId: string,
  ): Promise<SessionSale | null>;

  abstract getClosingReport(
    organizationId: string,
    sessionId: string,
  ): Promise<ClosingReport | null>;
}
