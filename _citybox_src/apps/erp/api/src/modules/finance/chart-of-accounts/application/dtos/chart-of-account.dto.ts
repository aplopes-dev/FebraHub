import type {
  ChartOfAccountListTab,
  ChartOfAccountWithGroup,
} from '../../domain/repositories/chart-of-account.repository.interface';

export type CreateChartOfAccountDto = {
  organizationId: string;
  name: string;
  financialGroupId: string;
  availableForPdv?: boolean;
};

export type UpdateChartOfAccountDto = {
  organizationId: string;
  id: string;
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
};

export type FindChartOfAccountByIdDto = {
  organizationId: string;
  id: string;
};

export type DeleteChartOfAccountDto = {
  organizationId: string;
  id: string;
};

export type RestoreChartOfAccountDto = {
  organizationId: string;
  id: string;
};

export type ListChartOfAccountsDto = {
  organizationId: string;
  search?: string;
  tab?: ChartOfAccountListTab;
  page?: number;
  perPage?: number;
};

export type ChartOfAccountListItem = ChartOfAccountWithGroup;

export type ChartOfAccountTabCounts = Record<ChartOfAccountListTab, number>;

export type ListChartOfAccountsResult = {
  items: ChartOfAccountListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: ChartOfAccountTabCounts;
};
