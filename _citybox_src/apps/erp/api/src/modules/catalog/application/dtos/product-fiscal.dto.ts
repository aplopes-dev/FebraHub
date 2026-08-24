import type {
  FiscalBranchOverride,
  FiscalGroupField,
  ProductFiscal,
  ProductFiscalInfo,
} from '../../domain/entities/product-fiscal.entity';
import type {
  FiscalParameterListRow,
  FiscalParameterSort,
  FiscalParameterStatus,
  FiscalParameterTab,
  FiscalParameterTabCounts,
} from '../../domain/repositories/product-fiscal.repository.interface';

export type ListFiscalParametersDto = {
  organizationId: string;
  page?: number;
  perPage?: number;
  tab?: FiscalParameterTab;
  search?: string;
  category?: string;
  categories?: string[];
  statuses?: FiscalParameterStatus[];
  sort?: FiscalParameterSort;
};

export type ListFiscalParametersResult = {
  items: FiscalParameterListRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: FiscalParameterTabCounts;
};

export type FindFiscalParametersByProductIdDto = {
  organizationId: string;
  productId: string;
};

export type FiscalParametersDetail = {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  categoryName: string;
  configured: boolean;
  info: ProductFiscalInfo;
  group: {
    icms: FiscalGroupField;
    pisCofins: FiscalGroupField;
    ipi: FiscalGroupField;
    cfop: FiscalGroupField;
    issqn: FiscalGroupField;
  };
  /** FK do grupo de PIS/COFINS (spec erp/015) — null = sem grupo. */
  pisCofinsGroupId: string | null;
  /** FK do grupo de ICMS (spec erp/016) — null = sem grupo. */
  icmsGroupId: string | null;
  /** FK do grupo de ISSQN (spec erp/018) — null = sem grupo. */
  issqnGroupId: string | null;
  /** FK do grupo de IPI (spec erp/019) — null = sem grupo. */
  ipiGroupId: string | null;
  units: FiscalBranchOverride[];
  fiscal: ProductFiscal | null;
};

export type UpsertFiscalParametersDto = {
  organizationId: string;
  productId: string;
  info: ProductFiscalInfo;
  group: {
    icms: FiscalGroupField;
    pisCofins: FiscalGroupField;
    ipi: FiscalGroupField;
    cfop: FiscalGroupField;
    issqn: FiscalGroupField;
  };
  /**
   * FK do grupo de PIS/COFINS (spec erp/015). `undefined` = campo ausente →
   * mantém o vínculo atual; `null` = limpa; string = define.
   */
  pisCofinsGroupId?: string | null;
  /** FK do grupo de ICMS (spec erp/016) — mesma semântica de `pisCofinsGroupId`. */
  icmsGroupId?: string | null;
  /** FK do grupo de ISSQN (spec erp/018) — mesma semântica de `pisCofinsGroupId`. */
  issqnGroupId?: string | null;
  /** FK do grupo de IPI (spec erp/019) — mesma semântica de `pisCofinsGroupId`. */
  ipiGroupId?: string | null;
  units: FiscalBranchOverride[];
};
