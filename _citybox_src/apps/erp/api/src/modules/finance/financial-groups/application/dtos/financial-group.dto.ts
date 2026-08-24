import type {
  FinancialGroup,
  FinancialGroupType,
} from '../../domain/entities/financial-group.entity';
import type { FinancialGroupListTab } from '../../domain/repositories/financial-group.repository.interface';

export type CreateFinancialGroupDto = {
  organizationId: string;
  name: string;
  type: FinancialGroupType;
};

export type UpdateFinancialGroupDto = {
  organizationId: string;
  id: string;
  name: string;
  type: FinancialGroupType;
};

export type DeleteFinancialGroupDto = {
  organizationId: string;
  id: string;
};

export type RestoreFinancialGroupDto = {
  organizationId: string;
  id: string;
};

export type FindFinancialGroupByIdDto = {
  organizationId: string;
  id: string;
};

export type ListFinancialGroupsDto = {
  organizationId: string;
  search?: string;
  tab?: FinancialGroupListTab;
  type?: FinancialGroupType;
  page?: number;
  perPage?: number;
};

export type FinancialGroupTabCounts = Record<FinancialGroupListTab, number>;

export type ListFinancialGroupsResult = {
  items: FinancialGroup[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: FinancialGroupTabCounts;
};
