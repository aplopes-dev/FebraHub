/**
 * Shapes do contrato real da `erp-api` (`/v1/financial-entries`) — ver
 * `specs/erp/001-financial-entries/contracts/financial-entries-api.md`.
 */

export type FinancialEntryOperationDto = "receivable" | "payable";
export type FinancialEntryStatusDto = "pending" | "paid";

export type FinancialEntryPaymentDto = {
  id: string;
  amountCents: number;
  paidAt: string;
  paymentMethod: string;
  cardBrand: string | null;
};

export type FinancialEntryAllocationDto = {
  id: string;
  chartOfAccountId: string;
  costCenterId: string;
  amountCents: number;
  percentage: number;
};

/** Nunca inclui `objectKey` — chave interna do MinIO. */
export type FinancialEntryAttachmentDto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

/** Detalhe completo — `GET /:id`, resposta de `POST`/`PUT`. */
export type FinancialEntryDetailDto = {
  id: string;
  operation: FinancialEntryOperationDto;
  description: string;
  amountCents: number;
  feesCents: number;
  finesCents: number;
  totalCents: number;
  paidCents: number;
  status: FinancialEntryStatusDto;
  competenceDate: string;
  dueDate: string;
  partyName: string;
  customerId: string | null;
  supplierId: string | null;
  bankAccountId: string | null;
  saleOrderId: string | null;
  categoryName: string;
  note: string;
  readOnly: boolean;
  /** Motor de recebíveis (specs/erp/005-card-receivables-engine/). */
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
  payments: FinancialEntryPaymentDto[];
  allocations: FinancialEntryAllocationDto[];
  attachments: FinancialEntryAttachmentDto[];
  deletedAt: string | null;
  createdAt: string;
};

/** Item da listagem — mais enxuto, sem `payments`/`allocations`. */
export type FinancialEntryListItemDto = {
  id: string;
  operation: FinancialEntryOperationDto;
  description: string;
  amountCents: number;
  feesCents: number;
  finesCents: number;
  totalCents: number;
  paidCents: number;
  status: FinancialEntryStatusDto;
  competenceDate: string;
  dueDate: string;
  partyName: string;
  categoryLabel: string | null;
  /** Motor de recebíveis (specs/erp/005-card-receivables-engine/). */
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export type FinancialEntryListResponseDto = {
  data: FinancialEntryListItemDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
  tabCounts: { active: number; deleted: number };
};

export type FinancialEntryPaymentWritablePayload = {
  id?: string;
  amountCents: number;
  paidAt: string;
  paymentMethod: string;
  cardBrand?: string | null;
};

export type FinancialEntryAllocationWritablePayload = {
  id?: string;
  chartOfAccountId: string;
  costCenterId: string;
  amountCents: number;
  percentage: number;
};

/** Corpo de `POST`/`PUT` — semântica destrutiva (RN-14): substitui o lançamento inteiro. */
export type SaveFinancialEntryPayload = {
  operation: FinancialEntryOperationDto;
  description?: string;
  amountCents: number;
  feesCents?: number;
  finesCents?: number;
  competenceDate: string;
  dueDate: string;
  partyName?: string;
  customerId?: string | null;
  supplierId?: string | null;
  bankAccountId?: string | null;
  categoryName?: string;
  note?: string;
  payments?: FinancialEntryPaymentWritablePayload[];
  allocations: FinancialEntryAllocationWritablePayload[];
};
