import type {
  PurchaseDeliveryStatus,
  PurchaseLineStatus,
} from '../../domain/entities/purchase.entity';
import type {
  PurchaseDetail,
  PurchaseListItem,
  PurchaseListStatus,
  PurchaseListTab,
} from '../../domain/repositories/purchase.repository.interface';

export type PurchaseLineDto = {
  productId: string;
  quantity: string;
  costCents: number;
  status?: PurchaseLineStatus;
};

export type CreatePurchaseDto = {
  organizationId: string;
  stockId: string;
  supplierId: string;
  carrierId?: string | null;
  deliveryStatus: PurchaseDeliveryStatus;
  purchasedAt: Date;
  series?: string;
  invoiceNumber?: string;
  notes?: string;
  freightCents?: number;
  discountsCents?: number;
  otherExpensesCents?: number;
  createdByUserId: string;
  lines: PurchaseLineDto[];
};

export type UpdatePurchaseDto = {
  organizationId: string;
  id: string;
  stockId: string;
  supplierId: string;
  carrierId?: string | null;
  deliveryStatus: PurchaseDeliveryStatus;
  purchasedAt: Date;
  series?: string;
  invoiceNumber?: string;
  notes?: string;
  freightCents?: number;
  discountsCents?: number;
  otherExpensesCents?: number;
  createdByUserId: string;
  lines: PurchaseLineDto[];
};

export type ListPurchasesDto = {
  organizationId: string;
  tab?: PurchaseListTab;
  status?: PurchaseListStatus;
  search?: string;
  stockId?: string;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  perPage?: number;
};

export type ListPurchasesResult = {
  items: PurchaseListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: { active: number; deleted: number };
};

export type FindPurchaseByIdDto = { organizationId: string; id: string };

export type FindPurchaseByIdResult = PurchaseDetail;

export type DeletePurchaseDto = { organizationId: string; id: string };

export type RestorePurchaseDto = { organizationId: string; id: string };
