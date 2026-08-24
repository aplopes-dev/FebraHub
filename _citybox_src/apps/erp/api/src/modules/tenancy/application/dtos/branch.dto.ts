import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import type {
  Branch,
  TaxRegimeValue,
} from '../../domain/entities/branch.entity';

export type BranchAddressDto = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

export type CreateBranchDto = BranchAddressDto & {
  organizationId: string;
  code: string;
  personType: PersonTypeValue;
  document: string;
  legalName: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: TaxRegimeValue;
  isHeadquarters?: boolean;
  phone?: string | null;
  email?: string | null;
  timezone?: string;
};

export type UpdateBranchDto = BranchAddressDto & {
  organizationId: string;
  id: string;
  legalName: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: TaxRegimeValue;
  isHeadquarters?: boolean;
  phone?: string | null;
  email?: string | null;
  timezone?: string;
  active?: boolean;
};

export type ListBranchesDto = {
  organizationId: string;
  search?: string;
  activeOnly?: boolean;
  includeDeleted?: boolean;
  /** Filiais que o solicitante pode ver — `null` para OWNER/ADMIN. */
  allowedBranchIds?: string[] | null;
  page?: number;
  perPage?: number;
};

export type ListBranchesResult = {
  items: Branch[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FindBranchByIdDto = {
  organizationId: string;
  id: string;
  /** Recorte por acesso do membro — `null`/omitido para OWNER/ADMIN. */
  allowedBranchIds?: string[] | null;
};

export type DeleteBranchDto = { organizationId: string; id: string };
