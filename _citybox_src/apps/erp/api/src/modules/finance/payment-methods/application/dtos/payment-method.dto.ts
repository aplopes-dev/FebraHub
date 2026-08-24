import type { PaymentMethod } from '../../domain/entities/payment-method.entity';
import type {
  PaymentMethodListTab,
  PaymentMethodTabCounts,
} from '../../domain/repositories/payment-method.repository.interface';

export type CreatePaymentMethodDto = {
  organizationId: string;
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
};

export type UpdatePaymentMethodDto = {
  organizationId: string;
  id: string;
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
};

export type DeletePaymentMethodDto = {
  organizationId: string;
  id: string;
};

export type RestorePaymentMethodDto = {
  organizationId: string;
  id: string;
};

export type FindPaymentMethodByIdDto = {
  organizationId: string;
  id: string;
};

export type ListPaymentMethodsDto = {
  organizationId: string;
  search?: string;
  tab?: PaymentMethodListTab;
  page?: number;
  perPage?: number;
};

export type ListPaymentMethodsResult = {
  items: PaymentMethod[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: PaymentMethodTabCounts;
};

export type ListPaymentMethodOptionsDto = {
  organizationId: string;
};
