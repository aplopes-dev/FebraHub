export const BRANCH_PERSON_TYPES = ["PJ", "PF"] as const;
export type BranchPersonType = (typeof BRANCH_PERSON_TYPES)[number];

export const BRANCH_PERSON_TYPE_LABELS: Record<BranchPersonType, string> = {
  PJ: "Pessoa jurídica",
  PF: "Pessoa física",
};

export const BRANCH_TAX_REGIMES = [
  "MEI",
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
  "LUCRO_REAL",
  "ISENTO",
] as const;
export type BranchTaxRegime = (typeof BRANCH_TAX_REGIMES)[number];

export const BRANCH_TAX_REGIME_LABELS: Record<BranchTaxRegime, string> = {
  MEI: "MEI",
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro presumido",
  LUCRO_REAL: "Lucro real",
  ISENTO: "Isento",
};

export const DEFAULT_BRANCH_TIMEZONE = "America/Bahia";

/** Endereço da unidade — campos vazios viram `""` no formulário. */
export type BranchAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type Branch = {
  id: string;
  code: string;
  personType: BranchPersonType;
  document: string;
  legalName: string;
  tradeName: string;
  /** Nome de exibição resolvido pela API (fantasia ou razão social). */
  displayName: string;
  stateRegistration: string;
  municipalRegistration: string;
  taxRegime: BranchTaxRegime;
  isHeadquarters: boolean;
  address: BranchAddress;
  phone: string;
  email: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BranchListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type BranchListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type BranchListResult = {
  data: Branch[];
  meta: BranchListMeta;
};

export type BranchFormValues = {
  code: string;
  personType: BranchPersonType;
  document: string;
  legalName: string;
  tradeName: string;
  stateRegistration: string;
  municipalRegistration: string;
  taxRegime: BranchTaxRegime;
  isHeadquarters: boolean;
  address: BranchAddress;
  phone: string;
  email: string;
  timezone: string;
  active: boolean;
};

export const EMPTY_BRANCH_ADDRESS: BranchAddress = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function createEmptyBranchFormValues(): BranchFormValues {
  return {
    code: "",
    personType: "PJ",
    document: "",
    legalName: "",
    tradeName: "",
    stateRegistration: "",
    municipalRegistration: "",
    taxRegime: "SIMPLES_NACIONAL",
    isHeadquarters: false,
    address: { ...EMPTY_BRANCH_ADDRESS },
    phone: "",
    email: "",
    timezone: DEFAULT_BRANCH_TIMEZONE,
    active: true,
  };
}

export function branchToFormValues(branch: Branch): BranchFormValues {
  return {
    code: branch.code,
    personType: branch.personType,
    document: branch.document,
    legalName: branch.legalName,
    tradeName: branch.tradeName,
    stateRegistration: branch.stateRegistration,
    municipalRegistration: branch.municipalRegistration,
    taxRegime: branch.taxRegime,
    isHeadquarters: branch.isHeadquarters,
    address: { ...branch.address },
    phone: branch.phone,
    email: branch.email,
    timezone: branch.timezone,
    active: branch.active,
  };
}

export function documentLabel(personType: BranchPersonType): string {
  return personType === "PJ" ? "CNPJ" : "CPF";
}
