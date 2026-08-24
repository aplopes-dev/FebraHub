export type CreateBankTransferDto = {
  organizationId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amountCents: number;
  effectiveAt: Date;
  paymentMethod: string;
  costCenterId: string;
  description?: string;
  createdByName?: string;
};
