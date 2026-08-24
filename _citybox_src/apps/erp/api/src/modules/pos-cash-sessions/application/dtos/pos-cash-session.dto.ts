import type { PosCashMovement } from '../../domain/entities/pos-cash-movement.entity';
import type { PosCashSession } from '../../domain/entities/pos-cash-session.entity';
import type {
  ClosingReport,
  ListCashSessionsResult,
  ListSessionSalesResult,
  SessionSale,
} from '../../domain/repositories/pos-cash-session.repository.interface';
import type { PosCashMovementType } from '../../domain/entities/pos-cash-movement.entity';

export type OpenCashSessionDto = {
  organizationId: string;
  branchId: string;
  posTerminalId: string;
  operatorUserId: string;
  openingFloatCents: number;
};

export type AddCashMovementDto = {
  organizationId: string;
  sessionId: string;
  type: PosCashMovementType;
  amountCents: number;
  reason?: string;
  operatorUserId: string;
  authorizedByUserId?: string | null;
};

export type CloseCashSessionDto = {
  organizationId: string;
  sessionId: string;
  countedCashCents: number;
  countedCreditCents: number;
  countedDebitCents: number;
  countedVoucherCents: number;
  countedOtherCents: number;
};

export type GetCurrentCashSessionDto = {
  organizationId: string;
  posTerminalId: string;
};

export type GetCashSessionByIdDto = {
  organizationId: string;
  sessionId: string;
};

export type ListCashSessionsDto = {
  organizationId: string;
  posTerminalId?: string;
  operatorName?: string;
  openedFrom?: string;
  openedTo?: string;
  page?: number;
  perPage?: number;
};

export type ListSessionSalesDto = {
  organizationId: string;
  sessionId: string;
  page?: number;
  perPage?: number;
};

export type GetSessionSaleDto = {
  organizationId: string;
  sessionId: string;
  saleOrderId: string;
};

export type ListSessionMovementsDto = {
  organizationId: string;
  sessionId: string;
};

export type GetClosingReportDto = {
  organizationId: string;
  sessionId: string;
};

export type {
  ClosingReport,
  ListCashSessionsResult,
  ListSessionSalesResult,
  PosCashMovement,
  PosCashSession,
  SessionSale,
};
