import type { CostCenter } from '../../domain/entities/cost-center.entity';
import type {
  CostCenterListTab,
  CostCenterTabCounts,
} from '../../domain/repositories/cost-center.repository.interface';

export type CreateCostCenterDto = {
  organizationId: string;
  name: string;
};

export type UpdateCostCenterDto = {
  organizationId: string;
  id: string;
  name: string;
};

export type DeleteCostCenterDto = {
  organizationId: string;
  id: string;
};

export type RestoreCostCenterDto = {
  organizationId: string;
  id: string;
};

export type FindCostCenterByIdDto = {
  organizationId: string;
  id: string;
};

export type ListCostCentersDto = {
  organizationId: string;
  search?: string;
  tab?: CostCenterListTab;
  page?: number;
  perPage?: number;
};

export type ListCostCentersResult = {
  items: CostCenter[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: CostCenterTabCounts;
};
