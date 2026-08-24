import type {
  BranchListMeta,
  BranchPersonType,
  BranchTaxRegime,
} from "@/features/branches/types/branch";

export type BranchAddressDto = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

export type BranchDto = {
  id: string;
  code: string;
  personType: BranchPersonType;
  document: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: BranchTaxRegime;
  isHeadquarters: boolean;
  address: BranchAddressDto | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BranchResponseDto = { data: BranchDto };

export type BranchListResponseDto = {
  data: BranchDto[];
  meta: BranchListMeta;
};

/**
 * Corpo de POST/PUT. Campo em branco é **omitido** — a API valida formato
 * (`@IsEmail`, tamanhos) e `""` seria rejeitado; omitir significa "sem valor".
 */
export type CreateBranchPayload = {
  code: string;
  personType: BranchPersonType;
  document: string;
  legalName: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  taxRegime?: BranchTaxRegime;
  isHeadquarters?: boolean;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  timezone?: string;
};

/** Código, documento e tipo de pessoa são imutáveis (identidade fiscal). */
export type UpdateBranchPayload = Omit<
  CreateBranchPayload,
  "code" | "personType" | "document"
> & {
  active?: boolean;
};
