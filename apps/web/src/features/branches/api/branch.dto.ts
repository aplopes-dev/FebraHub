import type {
  BranchListMeta,
  BranchPersonType,
  BranchTaxRegime,
  UnitKind,
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
  kind: UnitKind;
  matrixId: string | null;
  code: string;
  personType: BranchPersonType;
  document: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: BranchTaxRegime;
  address: BranchAddressDto | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
  hasLogo: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BranchResponseDto = { data: BranchDto };

export type BranchListResponseDto = {
  data: BranchDto[];
  meta: BranchListMeta;
};

export type OrganizationStructureResponseDto = {
  data: {
    groupName: string;
    matrices: BranchDto[];
    storesByMatrix: Record<string, BranchDto[]>;
  };
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
  matrixId?: string;
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
  "code" | "personType" | "document" | "matrixId"
> & {
  active?: boolean;
};
