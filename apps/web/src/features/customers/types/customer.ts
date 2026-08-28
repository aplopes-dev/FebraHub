export type CustomerStage = "lead" | "opportunity" | "active" | "inactive";

/**
 * Papéis acumulam — a mesma ficha é lead, participante de evento, aluno e
 * indicador ao mesmo tempo. O `stage` continua existindo porque é o contrato da
 * API; os papéis é que descrevem a pessoa como a Febracis a enxerga.
 */
export type CustomerRole =
  | "lead"
  | "participante"
  | "aluno"
  | "ex_aluno"
  | "indicador";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  salesTotal: number;
  createdAt: string;
  stage: CustomerStage;
  categoryId?: string | null;
  roles?: CustomerRole[];
};

export type CustomerListTab = "all" | CustomerStage;

export type CustomerTabCounts = Record<CustomerListTab, number>;

export type CustomerListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CustomerListParams = {
  tab: CustomerListTab;
  search: string;
  page: number;
  perPage: number;
};

export type CustomerListResult = {
  data: Customer[];
  meta: CustomerListMeta;
  tabCounts: CustomerTabCounts;
};
