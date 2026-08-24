export type DashboardSalesGoalRecord = {
  id: string;
  storeId: string;
  goalCents: number;
  /** Dia civil (yyyy-MM-dd) a partir do qual a meta acumula vendas. */
  startDate: string;
  createdAt: Date;
};

/**
 * Persistência da meta contínua de vendas (dashboard Metas de Vendas).
 * Append-only: a meta ativa é a linha mais recente da loja.
 */
export abstract class DashboardSalesGoalRepository {
  abstract findActive(
    storeId: string,
  ): Promise<DashboardSalesGoalRecord | null>;

  abstract create(input: {
    storeId: string;
    goalCents: number;
    startDate: string;
  }): Promise<DashboardSalesGoalRecord>;
}
