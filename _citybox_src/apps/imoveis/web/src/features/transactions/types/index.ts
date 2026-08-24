/** Tipos do módulo de transações (negócios, vendas e locações). */

export type TransactionStatus =
  | 'DRAFT'
  | 'PROPOSAL'
  | 'CONTRACT_SIGNED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TransactionType = 'SALE' | 'RENTAL';

export type TransactionPaymentMethod =
  | 'pix'
  | 'transfer'
  | 'boleto'
  | 'cash'
  | 'check'
  | 'debit'
  | 'credit'
  | 'financing'
  | 'consortium'
  | 'fgts'
  | 'trade-in'
  | 'other';

export type SplitSource = 'GLOBAL' | 'AGENT_OVERRIDE' | 'MANUAL';

export type RentalPayoutStatus =
  | 'AWAITING_PAYMENT'
  | 'PAID_BY_TENANT'
  | 'READY_FOR_PAYOUT'
  | 'PAID_TO_LANDLORD';

export type CommissionOtherSplit = {
  label: string;
  percent: number;
  amountCents: number;
};

export type CommissionSplit = {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others: readonly CommissionOtherSplit[];
  agencyAmountCents: number;
  captorAmountCents: number;
  sellerAmountCents: number;
  totalCommissionCents: number;
};

export type RentalDeduction = {
  label: string;
  amountCents: number;
};

export type RentalConfig = {
  landlordName: string;
  tenantName: string;
  baseRentCents: number;
  condoCents: number;
  iptuCents: number;
  adminFeePercent: number;
  dueDay: number;
  payoutStatus: RentalPayoutStatus;
  receivedCents: number;
  deductions: readonly RentalDeduction[];
  paidAt?: string;
  payoutAt?: string;
};

export type TransactionActivity = {
  id: string;
  at: string;
  actorName: string;
  message: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  propertyId?: string;
  propertyName: string;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  captorId: string;
  sellerId?: string;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  commissionPercent: number;
  split: CommissionSplit;
  splitSource: SplitSource;
  rental?: RentalConfig;
  activityLog: readonly TransactionActivity[];
  createdAt: string;
  updatedAt: string;
};

export type TransactionWriteInput = {
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  propertyId?: string;
  propertyName: string;
  leadId?: string;
  leadName?: string;
  captorId: string;
  sellerId?: string;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  commissionPercent: number;
  split: CommissionSplit;
  splitSource: SplitSource;
  rental?: RentalConfig;
};

export type ListTransactionsParams = {
  search?: string;
  page?: number;
  perPage?: number;
  type?: TransactionType[];
  status?: TransactionStatus[];
  agentId?: string;
  periodFrom?: string;
  periodTo?: string;
};

export type ListTransactionsResult = {
  data: readonly Transaction[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type CreateTransactionDraft = {
  type: TransactionType;
  propertyId: string;
  leadId: string;
  dealId?: string;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  sellerId: string;
  initialStatus: 'PROPOSAL' | 'CONTRACT_SIGNED';
};

export type CreateTransactionPrefill = Partial<{
  leadId: string;
  leadName: string;
  dealId: string;
  propertyId: string;
  propertyName: string;
  /** Imóveis já escolhidos no lead — priorizados no picker ao promover. */
  matchedProperties: readonly {
    id: string;
    name: string;
    coverPhotoUrl?: string;
  }[];
  sellerId: string;
  type: TransactionType;
  initialStatus: TransactionStatus;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
}>;

export type TransactionDocumentSource = 'lead' | 'property';

export type TransactionPackDocument = {
  id: string;
  name: string;
  sizeLabel: string;
  kind: 'contract' | 'other';
  source: TransactionDocumentSource;
  sentAt: string | null;
  sentChannel?: 'whatsapp' | 'share' | 'link' | null;
  path?: string;
};

export type TransactionDocumentChecklistItem = {
  id: 'contract' | 'property' | 'client';
  label: string;
  status: 'pending' | 'attached' | 'sent';
};

export type TransactionDocumentsPack = {
  items: readonly TransactionPackDocument[];
  checklist: readonly TransactionDocumentChecklistItem[];
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  DRAFT: 'Rascunho',
  PROPOSAL: 'Proposta',
  CONTRACT_SIGNED: 'Contrato assinado',
  COMPLETED: 'Pagamento confirmado',
  CANCELLED: 'Cancelado',
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  SALE: 'Venda',
  RENTAL: 'Locação',
};

export const RENTAL_PAYOUT_STATUS_LABEL: Record<RentalPayoutStatus, string> = {
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAID_BY_TENANT: 'Pago pelo inquilino',
  READY_FOR_PAYOUT: 'Pronto para repasse',
  PAID_TO_LANDLORD: 'Repassado ao proprietário',
};

export const SPLIT_SOURCE_LABEL: Record<SplitSource, string> = {
  GLOBAL: 'Padrão global',
  AGENT_OVERRIDE: 'Override do corretor',
  MANUAL: 'Ajuste manual',
};
