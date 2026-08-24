export type ServiceOrderHttpDto = {
  id: string;
  code: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  statusId: string;
  statusName: string | null;
  statusBaseType: string | null;
  sellerName: string;
  technicianName: string;
  openedAt: string;
  dueAt: string | null;
  totalCents: number;
  budgetedCents: number;
  diagnosisFeeCents: number;
  approvalStatus: string;
  approvalNotes: string;
  generatedSaleId: string | null;
  payloadJson: Record<string, unknown> | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceOrderStatusHttpDto = {
  id: string;
  name: string;
  baseType: string;
  sortOrder: number;
  active: boolean;
  variant: string;
};

export type ServiceOrderWritablePayload = {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  statusId: string;
  sellerName?: string;
  technicianName?: string;
  openedAt: string;
  dueAt?: string;
  totalCents?: number;
  budgetedCents?: number;
  diagnosisFeeCents?: number;
  approvalStatus?: string;
  approvalNotes?: string;
  payloadJson?: Record<string, unknown>;
};
