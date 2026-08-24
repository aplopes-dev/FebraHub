/**
 * Contrato HTTP de `/v1/pos-cash-sessions` (JWT) — não usar direto na UI.
 */

export type PosCashSessionDto = {
  id: string;
  organizationId: string;
  branchId: string;
  posTerminalId: string;
  posTerminalName?: string;
  status: "open" | "closed" | string;
  openedAt: string;
  closedAt: string | null;
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
  salesCount?: number;
  withdrawalCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PosCashMovementDto = {
  id: string;
  sessionId: string;
  type: "withdrawal" | "reinforcement";
  amountCents: number;
  reason: string | null;
  operation: string;
  operatorUserId: string;
  operatorName: string;
  authorizedByUserId: string | null;
  authorizedByName: string | null;
  createdAt: string;
};

export type PosCashSaleProductDto = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PosCashSalePaymentDto = {
  id: string;
  paidAt: string;
  method: string;
  methodId?: string;
  methodSystemKey?: string | null;
  amountCents: number;
};

export type PosCashSaleDto = {
  id: string;
  sessionId: string;
  number?: number;
  customerName: string;
  sellerName: string;
  operatorName?: string;
  status?: string;
  amountCents: number;
  paymentMethod: string;
  startedAt: string;
  endedAt: string;
  products: PosCashSaleProductDto[];
  payments: PosCashSalePaymentDto[];
};

export type PosCashClosingMethodRowDto = {
  method: string;
  informedCents: number;
  registeredCents: number;
};

export type PosCashClosingReportDto = {
  sessionId: string;
  posRegisterName: string;
  cashBoxLabel: string;
  openedAt: string;
  closedAt: string | null;
  openingBalanceCents: number;
  closingBalanceCents: number | null;
  salesCount: number;
  canceledSalesCount: number;
  informedTotalCents: number;
  methods: PosCashClosingMethodRowDto[];
};

export type PosCashSessionListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PosCashSessionListResponseDto = {
  data: PosCashSessionDto[];
  meta: PosCashSessionListMetaDto;
};

export type PosCashSessionResponseDto = {
  data: PosCashSessionDto;
};

export type PosCashSaleListResponseDto = {
  data: PosCashSaleDto[];
  meta: PosCashSessionListMetaDto;
};

export type PosCashSaleResponseDto = {
  data: PosCashSaleDto;
};

export type PosCashMovementsResponseDto = {
  data: PosCashMovementDto[];
};

export type PosCashClosingReportResponseDto = {
  data: PosCashClosingReportDto;
};
