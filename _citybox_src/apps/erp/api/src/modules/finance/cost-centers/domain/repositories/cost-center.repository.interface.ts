import type { CostCenter } from '../entities/cost-center.entity';

export const COST_CENTER_LIST_TABS = ['active', 'deleted'] as const;
export type CostCenterListTab = (typeof COST_CENTER_LIST_TABS)[number];

export type CostCenterListCriteria = {
  search?: string;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos. Um booleano `includeDeleted` não daria conta: a aba "Excluídos"
   * precisa dos excluídos **sozinhos**, não somados aos ativos.
   */
  tab?: CostCenterListTab;
  skip?: number;
  take?: number;
};

export type CostCenterTabCounts = Record<CostCenterListTab, number>;

export abstract class CostCenterRepository {
  /** Devolve também o excluído — a aba "Excluídos" leva até o detalhe dele. */
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<CostCenter | null>;

  /** Só entre os ativos: o nome de um excluído está livre para reutilização. */
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<CostCenter | null>;

  abstract findAll(
    organizationId: string,
    criteria?: CostCenterListCriteria,
  ): Promise<CostCenter[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<CostCenterListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores das abas — ignoram a busca de propósito. */
  abstract countByTabs(organizationId: string): Promise<CostCenterTabCounts>;

  abstract save(costCenter: CostCenter): Promise<CostCenter>;

  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;
}
