/**
 * Contrato da `erp-comercio-api` (`/v1/customers`, `/v1/customer-categories`).
 * A UI usa tipos em `types/` — tradução em `customer.mapper.ts`.
 */

export type CustomerPersonTypeDto = "PF" | "PJ";

export type CustomerStageDto =
  | "lead"
  | "opportunity"
  | "active"
  | "inactive";

export type CustomerAddressTypeDto = "principal" | "entrega" | "outro";

export type CustomerAddressDto = {
  id: string;
  addressType: CustomerAddressTypeDto;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
};

/** Item da listagem (presenter enxuto). */
export type CustomerListItemDto = {
  id: string;
  name: string;
  email: string;
  phone: string;
  salesTotal: number;
  createdAt: string;
  stage: CustomerStageDto;
  categoryId: string | null;
};

/** Detalhe completo (create/get/update). */
export type CustomerDetailDto = {
  id: string;
  personType: CustomerPersonTypeDto;
  name: string;
  document: string | null;
  rg: string | null;
  birthDate: string | null;
  email: string | null;
  mobilePhone: string | null;
  phone: string | null;
  additionalPhones: string[];
  stage: CustomerStageDto;
  categoryId: string | null;
  notes: string;
  addresses: CustomerAddressDto[];
  branchIds: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CustomerTabCountsDto = {
  all: number;
  lead: number;
  opportunity: number;
  active: number;
  inactive: number;
};

export type CustomerListResponseDto = {
  data: CustomerListItemDto[];
  meta: CustomerListMetaDto;
  tabCounts: CustomerTabCountsDto;
};

export type CustomerResponseDto = {
  data: CustomerDetailDto;
};

export type SaveCustomerAddressPayload = {
  id?: string;
  addressType: CustomerAddressTypeDto;
  zipCode?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  complement?: string;
};

export type SaveCustomerPayload = {
  personType: CustomerPersonTypeDto;
  name: string;
  document?: string;
  rg?: string;
  birthDate?: string;
  email?: string;
  mobilePhone?: string;
  phone?: string;
  additionalPhones?: string[];
  stage?: CustomerStageDto;
  categoryId?: string;
  notes?: string;
  addresses?: SaveCustomerAddressPayload[];
  branchIds?: string[];
};

export type CustomerCategoryDto = {
  id: string;
  name: string;
  discountPercentage: number;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCategoryListResponseDto = {
  data: CustomerCategoryDto[];
  meta: CustomerListMetaDto;
};

export type CustomerCategoryResponseDto = {
  data: CustomerCategoryDto;
};

export type SaveCustomerCategoryPayload = {
  name: string;
  discountPercentage: number;
};
