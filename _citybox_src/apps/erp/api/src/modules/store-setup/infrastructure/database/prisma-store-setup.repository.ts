import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { StoreSetupRepository } from '../../domain/repositories/store-setup.repository.interface';
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
import {
  writeProductCategories,
  writeStocks,
  writeUnitsOfMeasure,
} from './writers/catalog.writer';
import { writeMovementCategories } from './writers/movement-categories.writer';
import {
  writeChartOfAccounts,
  writeCostCenters,
  writeFinancialGroups,
  writePaymentMethods,
} from './writers/finance.writer';
import { writePermissionProfiles } from './writers/permission-profiles.writer';
import {
  writeContractStatuses,
  writeServiceOrderStatuses,
} from './writers/statuses.writer';

/**
 * Usa o cliente **cru**, não o `scoped`.
 *
 * O provisionamento recebe o `organizationId` como argumento e escreve nele — inclusive
 * quando roda fora de requisição (consumidor de evento) ou logo após criar a organização,
 * antes de existir contexto de tenant. Cada query abaixo filtra por `organizationId`
 * explicitamente; é a mesma exceção declarada do `TenantContextGuard`.
 */
@Injectable()
export class PrismaStoreSetupRepository extends StoreSetupRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAppliedVersion(organizationId: string): Promise<number | null> {
    const log = await this.prisma.storeSetupLog.findUnique({
      where: { organizationId },
      select: { version: true },
    });
    return log?.version ?? null;
  }

  async saveAppliedVersion(
    organizationId: string,
    version: number,
    completedAt: Date,
  ): Promise<void> {
    await this.prisma.storeSetupLog.upsert({
      where: { organizationId },
      create: { organizationId, version, completedAt },
      update: { version, completedAt },
    });
  }

  async listBranchIds(organizationId: string): Promise<string[]> {
    const branches = await this.prisma.branch.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true },
    });
    return branches.map((branch) => branch.id);
  }

  async listOrganizationIds(): Promise<string[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return organizations.map((organization) => organization.id);
  }

  async upsertPermissionProfiles(
    organizationId: string,
    items: readonly SeedPermissionProfile[],
  ): Promise<void> {
    await writePermissionProfiles(this.prisma, organizationId, items);
  }

  async upsertMovementCategories(
    organizationId: string,
    items: readonly SeedMovementCategory[],
    branchIds: readonly string[],
  ): Promise<void> {
    await writeMovementCategories(
      this.prisma,
      organizationId,
      items,
      branchIds,
    );
  }

  async upsertUnitsOfMeasure(
    organizationId: string,
    items: readonly SeedUnitOfMeasure[],
  ): Promise<void> {
    await writeUnitsOfMeasure(this.prisma, organizationId, items);
  }

  async upsertProductCategories(
    organizationId: string,
    items: readonly SeedProductCategory[],
  ): Promise<void> {
    await writeProductCategories(this.prisma, organizationId, items);
  }

  async upsertStocks(
    organizationId: string,
    items: readonly SeedStock[],
    branchIds: readonly string[],
  ): Promise<void> {
    await writeStocks(this.prisma, organizationId, items, branchIds);
  }

  async upsertFinancialGroups(
    organizationId: string,
    items: readonly SeedFinancialGroup[],
  ): Promise<void> {
    await writeFinancialGroups(this.prisma, organizationId, items);
  }

  async upsertChartOfAccounts(
    organizationId: string,
    items: readonly SeedChartOfAccount[],
  ): Promise<void> {
    await writeChartOfAccounts(this.prisma, organizationId, items);
  }

  async upsertCostCenters(
    organizationId: string,
    items: readonly SeedCostCenter[],
  ): Promise<void> {
    await writeCostCenters(this.prisma, organizationId, items);
  }

  async upsertPaymentMethods(
    organizationId: string,
    items: readonly SeedPaymentMethod[],
  ): Promise<void> {
    await writePaymentMethods(this.prisma, organizationId, items);
  }

  async upsertServiceOrderStatuses(
    organizationId: string,
    items: readonly SeedServiceOrderStatus[],
  ): Promise<void> {
    await writeServiceOrderStatuses(this.prisma, organizationId, items);
  }

  async upsertContractStatuses(
    organizationId: string,
    items: readonly SeedContractStatus[],
  ): Promise<void> {
    await writeContractStatuses(this.prisma, organizationId, items);
  }
}
