import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import type {
  Customer,
  CustomerAddressInput,
  CustomerStageValue,
} from '../../domain/entities/customer.entity';
import type { CustomerListTab } from '../../domain/repositories/customer.repository.interface';

export type CustomerWritableDto = {
  personType: PersonTypeValue;
  name: string;
  document?: string | null;
  rg?: string | null;
  birthDate?: Date | null;
  email?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  additionalPhones?: string[];
  stage?: CustomerStageValue;
  categoryId?: string | null;
  notes?: string | null;
  addresses?: CustomerAddressInput[];
  branchIds?: string[];
};

export type CreateCustomerDto = CustomerWritableDto & {
  organizationId: string;
};

export type UpdateCustomerDto = CustomerWritableDto & {
  organizationId: string;
  id: string;
  branchIds: string[];
};

export type ListCustomersDto = {
  organizationId: string;
  search?: string;
  tab?: CustomerListTab;
  page?: number;
  perPage?: number;
};

export type CustomerTabCounts = Record<CustomerListTab, number>;

export type ListCustomersResult = {
  items: Customer[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: CustomerTabCounts;
};

export type FindCustomerByIdDto = { organizationId: string; id: string };
export type DeleteCustomerDto = { organizationId: string; id: string };
export type RestoreCustomerDto = { organizationId: string; id: string };
