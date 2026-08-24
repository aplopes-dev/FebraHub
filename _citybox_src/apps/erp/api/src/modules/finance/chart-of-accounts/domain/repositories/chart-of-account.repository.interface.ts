import type { FinancialGroupType } from '../../../financial-groups/domain/entities/financial-group.entity';
import type { ChartOfAccount } from '../entities/chart-of-account.entity';

export const CHART_OF_ACCOUNT_LIST_TABS = ['active', 'deleted'] as const;
export type ChartOfAccountListTab = (typeof CHART_OF_ACCOUNT_LIST_TABS)[number];

/** Apelido local do tipo do grupo financeiro, que é quem manda no valor. */
export type ChartOfAccountFinancialGroupType = FinancialGroupType;

export type ChartOfAccountListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz as não excluídas; `deleted`, só as
   * excluídas — a aba "Excluídas" precisa delas sozinhas, não somadas às ativas.
   */
  tab?: ChartOfAccountListTab;
  skip?: number;
  take?: number;
};

/**
 * Conta já com o grupo financeiro resolvido: a tela lista nome e tipo do grupo
 * em toda linha, e buscá-los um a um viraria N+1.
 */
export type ChartOfAccountWithGroup = {
  account: ChartOfAccount;
  financialGroupName: string;
  financialGroupType: ChartOfAccountFinancialGroupType;
};

export abstract class ChartOfAccountRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<ChartOfAccount | null>;
  abstract findByIdWithGroup(
    organizationId: string,
    id: string,
  ): Promise<ChartOfAccountWithGroup | null>;
  /**
   * Procura pelo nome **incluindo as excluídas**: o unique do banco
   * (`organizationId, name`) não conhece soft-delete. Filtrar as excluídas aqui
   * faria a checagem passar e o INSERT estourar como 500.
   */
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<ChartOfAccount | null>;
  abstract findAll(
    organizationId: string,
    criteria?: ChartOfAccountListCriteria,
  ): Promise<ChartOfAccountWithGroup[]>;
  abstract count(
    organizationId: string,
    criteria?: ChartOfAccountListCriteria,
  ): Promise<number>;
  abstract save(account: ChartOfAccount): Promise<ChartOfAccount>;
}
