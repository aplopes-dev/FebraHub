import type { PrismaClient } from '../../../../../generated/prisma/client';
import type { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ERP_SEED_TEMPLATE } from '../../application/seed-data/erp-seed-template';
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
 * Aplica o template de sistema usando um `PrismaClient` cru.
 *
 * Usado pelo `prisma/seed.ts` (fora do Nest) e espelha o que
 * `ProvisionOrganizationDataUseCase` faz via repositório — a diferença é só o
 * transporte do cliente. Sempre força a aplicação: o seed de desenvolvimento
 * precisa do estado completo a cada execução.
 */
export async function applyErpSeedTemplate(
  prisma: PrismaClient,
  organizationId: string,
): Promise<{ version: number }> {
  const client = prisma as unknown as PrismaService;
  const template = ERP_SEED_TEMPLATE;

  const branches = await prisma.branch.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true },
  });
  const branchIds = branches.map((branch) => branch.id);

  await writePermissionProfiles(
    client,
    organizationId,
    template.permissionProfiles,
  );
  await writeUnitsOfMeasure(client, organizationId, template.unitsOfMeasure);
  await writeProductCategories(
    client,
    organizationId,
    template.productCategories,
  );
  await writeStocks(client, organizationId, template.stocks, branchIds);
  await writeMovementCategories(
    client,
    organizationId,
    template.movementCategories,
    branchIds,
  );
  await writeFinancialGroups(client, organizationId, template.financialGroups);
  await writeChartOfAccounts(client, organizationId, template.chartOfAccounts);
  await writeCostCenters(client, organizationId, template.costCenters);
  await writePaymentMethods(client, organizationId, template.paymentMethods);
  await writeServiceOrderStatuses(
    client,
    organizationId,
    template.serviceOrderStatuses,
  );
  await writeContractStatuses(
    client,
    organizationId,
    template.contractStatuses,
  );

  const completedAt = new Date();
  await prisma.storeSetupLog.upsert({
    where: { organizationId },
    create: {
      organizationId,
      version: template.version,
      completedAt,
    },
    update: { version: template.version, completedAt },
  });

  return { version: template.version };
}
