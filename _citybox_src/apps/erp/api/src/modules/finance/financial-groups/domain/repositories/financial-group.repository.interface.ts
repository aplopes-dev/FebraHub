import type {
  FinancialGroup,
  FinancialGroupType,
} from '../entities/financial-group.entity';

export const FINANCIAL_GROUP_LIST_TABS = ['active', 'deleted'] as const;
export type FinancialGroupListTab = (typeof FINANCIAL_GROUP_LIST_TABS)[number];

export type FinancialGroupListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos. Um booleano `includeDeleted` não daria conta: a aba "Excluídos"
   * precisa dos excluídos **sozinhos**, não somados aos ativos.
   */
  tab?: FinancialGroupListTab;
  type?: FinancialGroupType;
  skip?: number;
  take?: number;
};

export abstract class FinancialGroupRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<FinancialGroup | null>;
  /** Procura só entre os não excluídos — o nome de um grupo excluído é livre. */
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<FinancialGroup | null>;
  abstract findAll(
    organizationId: string,
    criteria?: FinancialGroupListCriteria,
  ): Promise<FinancialGroup[]>;
  abstract count(
    organizationId: string,
    criteria?: FinancialGroupListCriteria,
  ): Promise<number>;
  /** Conta as contas do plano ainda ativas (não excluídas) no grupo. */
  abstract countChartOfAccounts(
    organizationId: string,
    groupId: string,
  ): Promise<number>;
  abstract save(group: FinancialGroup): Promise<FinancialGroup>;
}
