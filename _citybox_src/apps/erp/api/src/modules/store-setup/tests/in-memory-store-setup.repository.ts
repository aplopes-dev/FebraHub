import { StoreSetupRepository } from '../domain/repositories/store-setup.repository.interface';
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
} from '../application/seed-data/seed-template.types';
import { SYSTEM_PROFILE_ADMINISTRADOR } from '../../../shared/infra/http/permissions/fine-to-coarse';

type SeedItem = { systemKey: string; name: string };

/**
 * Fake com a mesma semântica do Prisma: chave `(organizationId, systemKey)`, upsert que
 * preserva o nome já gravado. É o que permite testar idempotência sem banco.
 */
export class InMemoryStoreSetupRepository extends StoreSetupRepository {
  readonly appliedVersions = new Map<string, number>();
  readonly branchIdsByOrganization = new Map<string, string[]>();
  readonly organizationIds: string[] = [];

  readonly permissionProfiles = new Map<string, SeedPermissionProfile>();
  /** Memberships com `permissionProfileId` nulo — simulam o backfill. */
  readonly membershipsWithoutProfile = new Set<string>();
  readonly membershipProfileById = new Map<string, string>();

  readonly movementCategories = new Map<string, SeedMovementCategory>();
  readonly movementCategoryBranches = new Set<string>();
  readonly unitsOfMeasure = new Map<string, SeedUnitOfMeasure>();
  readonly productCategories = new Map<string, SeedProductCategory>();
  readonly stocks = new Map<string, SeedStock>();
  readonly stockBranches = new Set<string>();
  readonly financialGroups = new Map<string, SeedFinancialGroup>();
  readonly chartOfAccounts = new Map<string, SeedChartOfAccount>();
  readonly costCenters = new Map<string, SeedCostCenter>();
  readonly paymentMethods = new Map<string, SeedPaymentMethod>();
  readonly serviceOrderStatuses = new Map<string, SeedServiceOrderStatus>();
  readonly contractStatuses = new Map<string, SeedContractStatus>();

  findAppliedVersion(organizationId: string): Promise<number | null> {
    return Promise.resolve(this.appliedVersions.get(organizationId) ?? null);
  }

  saveAppliedVersion(organizationId: string, version: number): Promise<void> {
    this.appliedVersions.set(organizationId, version);
    return Promise.resolve();
  }

  listBranchIds(organizationId: string): Promise<string[]> {
    return Promise.resolve(
      this.branchIdsByOrganization.get(organizationId) ?? [],
    );
  }

  listOrganizationIds(): Promise<string[]> {
    return Promise.resolve([...this.organizationIds]);
  }

  upsertPermissionProfiles(
    organizationId: string,
    items: readonly SeedPermissionProfile[],
  ): Promise<void> {
    this.upsertAll(this.permissionProfiles, organizationId, items);

    const admin = items.find(
      (item) => item.systemKey === SYSTEM_PROFILE_ADMINISTRADOR,
    );
    if (!admin) return Promise.resolve();

    const adminKey = `${organizationId}:${admin.systemKey}`;
    for (const membershipId of [...this.membershipsWithoutProfile]) {
      if (!membershipId.startsWith(`${organizationId}:`)) continue;
      this.membershipProfileById.set(membershipId, adminKey);
      this.membershipsWithoutProfile.delete(membershipId);
    }
    return Promise.resolve();
  }

  upsertMovementCategories(
    organizationId: string,
    items: readonly SeedMovementCategory[],
    branchIds: readonly string[],
  ): Promise<void> {
    this.upsertAll(this.movementCategories, organizationId, items);
    for (const item of items) {
      for (const branchId of branchIds) {
        this.movementCategoryBranches.add(
          `${organizationId}:${item.systemKey}:${branchId}`,
        );
      }
    }
    return Promise.resolve();
  }

  upsertUnitsOfMeasure(
    organizationId: string,
    items: readonly SeedUnitOfMeasure[],
  ): Promise<void> {
    this.upsertAll(this.unitsOfMeasure, organizationId, items);
    return Promise.resolve();
  }

  upsertProductCategories(
    organizationId: string,
    items: readonly SeedProductCategory[],
  ): Promise<void> {
    this.upsertAll(this.productCategories, organizationId, items);
    return Promise.resolve();
  }

  upsertStocks(
    organizationId: string,
    items: readonly SeedStock[],
    branchIds: readonly string[],
  ): Promise<void> {
    this.upsertAll(this.stocks, organizationId, items);
    for (const item of items) {
      for (const branchId of branchIds) {
        this.stockBranches.add(
          `${organizationId}:${item.systemKey}:${branchId}`,
        );
      }
    }
    return Promise.resolve();
  }

  upsertFinancialGroups(
    organizationId: string,
    items: readonly SeedFinancialGroup[],
  ): Promise<void> {
    this.upsertAll(this.financialGroups, organizationId, items);
    return Promise.resolve();
  }

  upsertChartOfAccounts(
    organizationId: string,
    items: readonly SeedChartOfAccount[],
  ): Promise<void> {
    this.upsertAll(this.chartOfAccounts, organizationId, items);
    return Promise.resolve();
  }

  upsertCostCenters(
    organizationId: string,
    items: readonly SeedCostCenter[],
  ): Promise<void> {
    this.upsertAll(this.costCenters, organizationId, items);
    return Promise.resolve();
  }

  upsertPaymentMethods(
    organizationId: string,
    items: readonly SeedPaymentMethod[],
  ): Promise<void> {
    this.upsertAll(this.paymentMethods, organizationId, items);
    return Promise.resolve();
  }

  upsertServiceOrderStatuses(
    organizationId: string,
    items: readonly SeedServiceOrderStatus[],
  ): Promise<void> {
    this.upsertAll(this.serviceOrderStatuses, organizationId, items);
    return Promise.resolve();
  }

  upsertContractStatuses(
    organizationId: string,
    items: readonly SeedContractStatus[],
  ): Promise<void> {
    this.upsertAll(this.contractStatuses, organizationId, items);
    return Promise.resolve();
  }

  private upsertAll<T extends SeedItem>(
    store: Map<string, T>,
    organizationId: string,
    items: readonly T[],
  ): void {
    for (const item of items) {
      const key = `${organizationId}:${item.systemKey}`;
      const existing = store.get(key);
      // Preserva o nome customizado, como o repositório Prisma faz.
      store.set(key, existing ? { ...item, name: existing.name } : { ...item });
    }
  }
}
