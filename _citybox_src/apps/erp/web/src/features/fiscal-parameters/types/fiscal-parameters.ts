export type FiscalStatus = "configured" | "pending";

export type FiscalParameterListItem = {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: string;
  /** Derivado na API: existe ficha com NCM e origem preenchidos. */
  configured: boolean;
};

export type FiscalParameterListTab = "all" | "pending";

export type FiscalParameterListFilters = {
  categories: string[];
  statuses: FiscalStatus[];
};

export type FiscalParameterSortOption =
  | "name_asc"
  | "name_desc"
  | "category_asc"
  | "category_desc";

export type FiscalParameterTabCounts = Record<FiscalParameterListTab, number>;

export type FiscalParameterListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FiscalParameterListParams = {
  tab: FiscalParameterListTab;
  search: string;
  category: string;
  filters: FiscalParameterListFilters;
  sort: FiscalParameterSortOption;
  page: number;
  perPage: number;
};

export type FiscalParameterListResult = {
  data: FiscalParameterListItem[];
  meta: FiscalParameterListMeta;
  tabCounts: FiscalParameterTabCounts;
};

/** Opção genérica de Select fiscal (NCM, Origem, ICMS, …). */
export type FiscalOption = {
  value: string;
  label: string;
};

/** Informações fiscais gerais do produto. */
export type FiscalInfoValues = {
  ncm: string;
  origin: string;
  netWeight: string;
  grossWeight: string;
  cest: string;
  fcp: string;
  fcpSt: string;
  fcpStRetained: string;
  cstIbsCbs: string;
  taxClassification: string;
};

/** Campo do grupo fiscal geral: valor + se aplica a todas as unidades. */
export type FiscalGroupField = {
  value: string;
  applyToAll: boolean;
};

export type FiscalGroupValues = {
  icms: FiscalGroupField;
  pisCofins: FiscalGroupField;
  ipi: FiscalGroupField;
  cfop: FiscalGroupField;
  issqn: FiscalGroupField;
};

/** Configuração fiscal por unidade (branch). */
export type FiscalUnitConfig = {
  branchId: string;
  icms: string;
  pisCofins: string;
  ipi: string;
  cfop: string;
  issqn: string;
};

export type FiscalParametersFormValues = {
  info: FiscalInfoValues;
  group: FiscalGroupValues;
  units: FiscalUnitConfig[];
};
