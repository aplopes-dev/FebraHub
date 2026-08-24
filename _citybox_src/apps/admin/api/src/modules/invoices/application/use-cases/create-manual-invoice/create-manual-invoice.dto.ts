export interface CreateManualInvoiceDto {
  storeId: string;
  subscriptionId?: string;
  amountCents: number;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}
