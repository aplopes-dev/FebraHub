import type {
  CompanyAddress,
  CompanyEnvironment,
  TaxRegime,
} from '../../domain/entities/company.entity';

export type CreateCompanyDto = {
  storeId: string;
  cnpj: string;
  legalName: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime: TaxRegime;
  cityCodeIbge: string;
  uf: string;
  address: CompanyAddress;
  defaultEnvironment?: CompanyEnvironment;
  /// Municipio do emitente aderiu ao Padrao Nacional da NFS-e (FR-020).
  /// Default `false` — habilitar e ato deliberado de cadastro.
  nationalNfseEnabled?: boolean;
  accountingOfficeDocument?: string | null;
};

export type ListCompaniesDto = {
  page?: number;
  perPage?: number;
  cnpj?: string;
  active?: boolean;
};

export type GetCompanyDto = {
  companyId: string;
};

export type UpdateCompanyDto = {
  companyId: string;
  legalName?: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: TaxRegime;
  address?: CompanyAddress;
  defaultEnvironment?: CompanyEnvironment;
  nationalNfseEnabled?: boolean;
  accountingOfficeDocument?: string | null;
  active?: boolean;
  inutilizationJustification?: string | null;
  cancellationJustification?: string | null;
};
