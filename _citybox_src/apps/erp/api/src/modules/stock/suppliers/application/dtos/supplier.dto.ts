import type { PersonTypeValue } from '../../../../../shared/core/utils/document';
import type { Supplier } from '../../domain/entities/supplier.entity';
import type { SupplierListTab } from '../../domain/repositories/supplier.repository.interface';

export type SupplierAddressDto = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

export type SupplierContactDto = {
  email?: string | null;
  commercialPhone?: string | null;
  mobilePhone?: string | null;
};

type SupplierWritableDto = SupplierAddressDto &
  SupplierContactDto & {
    personType: PersonTypeValue;
    name: string;
    legalName?: string | null;
    document: string;
    stateRegistration?: string | null;
    stateExempt?: boolean;
    municipalRegistration?: string | null;
    sufamaRegistration?: string | null;
    foundationDate?: Date | null;
    note?: string | null;
    branchIds?: string[];
  };

export type CreateSupplierDto = SupplierWritableDto & {
  organizationId: string;
};

export type UpdateSupplierDto = SupplierWritableDto & {
  organizationId: string;
  id: string;
};

export type ListSuppliersDto = {
  organizationId: string;
  search?: string;
  tab?: SupplierListTab;
  page?: number;
  perPage?: number;
};

export type SupplierTabCounts = Record<SupplierListTab, number>;

export type ListSuppliersResult = {
  items: Supplier[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: SupplierTabCounts;
};

export type FindSupplierByIdDto = { organizationId: string; id: string };

export type DeleteSupplierDto = { organizationId: string; id: string };

export type RestoreSupplierDto = { organizationId: string; id: string };
