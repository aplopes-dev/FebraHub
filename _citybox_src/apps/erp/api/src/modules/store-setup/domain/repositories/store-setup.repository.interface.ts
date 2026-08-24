import type {
  SeedChartOfAccount,
  SeedContractStatus,
  SeedCostCenter,
  SeedFinancialGroup,
  SeedMovementCategory,
  SeedPaymentMethod,
  SeedPermissionProfile,
  SeedProductCategory,
  SeedServiceOrderStatus,
  SeedStock,
  SeedUnitOfMeasure,
} from '../../application/seed-data/seed-template.types';

/**
 * Escrita do template de provisionamento.
 *
 * Todo `upsert*` é idempotente por `(organizationId, systemKey)` e **não** sobrescreve o
 * que o usuário renomeou: reexecutar o provisionamento não pode desfazer customização.
 * Só o que é estrutural (tipo, grupo, vínculo com unidade) é reafirmado.
 */
export abstract class StoreSetupRepository {
  /** Versão do template já aplicada, ou `null` se a organização nunca foi provisionada. */
  abstract findAppliedVersion(organizationId: string): Promise<number | null>;

  abstract saveAppliedVersion(
    organizationId: string,
    version: number,
    completedAt: Date,
  ): Promise<void>;

  /** Unidades ativas da organização — os blocos com vínculo por unidade precisam delas. */
  abstract listBranchIds(organizationId: string): Promise<string[]>;

  /** Organizações vivas, para o comando de reprovisionamento em lote. */
  abstract listOrganizationIds(): Promise<string[]>;

  abstract upsertPermissionProfiles(
    organizationId: string,
    items: readonly SeedPermissionProfile[],
  ): Promise<void>;

  abstract upsertMovementCategories(
    organizationId: string,
    items: readonly SeedMovementCategory[],
    branchIds: readonly string[],
  ): Promise<void>;

  abstract upsertUnitsOfMeasure(
    organizationId: string,
    items: readonly SeedUnitOfMeasure[],
  ): Promise<void>;

  abstract upsertProductCategories(
    organizationId: string,
    items: readonly SeedProductCategory[],
  ): Promise<void>;

  abstract upsertStocks(
    organizationId: string,
    items: readonly SeedStock[],
    branchIds: readonly string[],
  ): Promise<void>;

  abstract upsertFinancialGroups(
    organizationId: string,
    items: readonly SeedFinancialGroup[],
  ): Promise<void>;

  abstract upsertChartOfAccounts(
    organizationId: string,
    items: readonly SeedChartOfAccount[],
  ): Promise<void>;

  abstract upsertCostCenters(
    organizationId: string,
    items: readonly SeedCostCenter[],
  ): Promise<void>;

  abstract upsertPaymentMethods(
    organizationId: string,
    items: readonly SeedPaymentMethod[],
  ): Promise<void>;

  abstract upsertServiceOrderStatuses(
    organizationId: string,
    items: readonly SeedServiceOrderStatus[],
  ): Promise<void>;

  abstract upsertContractStatuses(
    organizationId: string,
    items: readonly SeedContractStatus[],
  ): Promise<void>;
}
