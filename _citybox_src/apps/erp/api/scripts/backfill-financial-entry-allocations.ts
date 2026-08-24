import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';
import {
  SEED_CHART_OF_ACCOUNTS,
  SEED_COST_CENTERS,
  SEED_FINANCIAL_GROUPS,
} from '../src/modules/store-setup/application/seed-data/finance.seed';
import {
  writeChartOfAccounts,
  writeCostCenters,
  writeFinancialGroups,
} from '../src/modules/store-setup/infrastructure/database/writers/finance.writer';

/**
 * Backfill de rateio por categoria dos lançamentos financeiros legados
 * (anteriores a esta feature — `FinancialEntry.categoryName` string solta,
 * sem `allocations[]`) — ver research.md D7/D9/D10.
 *
 * Para cada organização:
 * 1. Garante (upsert por `systemKey`, reaproveitando os `writers` do
 *    provisionamento) as contas `outras-receitas`/`outras-despesas` e o
 *    centro de custo `administrativo` — fallback quando `categoryName` não
 *    casa com nenhuma conta existente.
 * 2. Para cada `FinancialEntry` sem `allocations[]`, cria 1
 *    `FinancialEntryAllocation` de 100% do total, casando `categoryName`
 *    (trim + case-insensitive) com `ChartOfAccount.name` da mesma
 *    organização; cai no fallback (por tipo de operação — `receivable` →
 *    `outras-receitas`, `payable` → `outras-despesas`) quando não casar.
 *
 * Idempotente: só toca lançamentos que ainda não têm nenhuma `allocation`.
 *
 * Uso: pnpm --filter @citybox/erp-api db:backfill:financial-entries
 */
@Module({ imports: [PrismaModule] })
class BackfillScriptModule {}

const RECEIVABLE_FALLBACK_ACCOUNT_KEY = 'outras-receitas';
const PAYABLE_FALLBACK_ACCOUNT_KEY = 'outras-despesas';
// `outras-despesas-grupo` entrou quando a 007-financeiro-ajustes-ui moveu a
// conta de fallback `outras-despesas` para um grupo próprio (antes vivia sob
// `despesas`) — sem essa chave aqui, `writeChartOfAccounts` pularia a conta
// de fallback payable por não achar o grupo ainda criado nesta execução.
const FALLBACK_GROUP_KEYS = [
  'outras-receitas',
  'despesas',
  'outras-despesas-grupo',
];
const FALLBACK_ACCOUNT_KEYS = [
  RECEIVABLE_FALLBACK_ACCOUNT_KEY,
  PAYABLE_FALLBACK_ACCOUNT_KEY,
];
const FALLBACK_COST_CENTER_KEY = 'administrativo';

type FallbackIds = {
  receivableAccountId: string;
  payableAccountId: string;
  costCenterId: string;
};

function normalizeAccountName(value: string): string {
  return value.trim().toLowerCase();
}

/** Garante as 2 contas + 1 centro de custo de fallback (D7/D9) — idempotente. */
async function ensureFallbackData(
  prisma: PrismaService,
  organizationId: string,
): Promise<FallbackIds | null> {
  const fallbackGroups = SEED_FINANCIAL_GROUPS.filter((group) =>
    FALLBACK_GROUP_KEYS.includes(group.systemKey),
  );
  await writeFinancialGroups(prisma, organizationId, fallbackGroups);

  const fallbackAccounts = SEED_CHART_OF_ACCOUNTS.filter((account) =>
    FALLBACK_ACCOUNT_KEYS.includes(account.systemKey),
  );
  await writeChartOfAccounts(prisma, organizationId, fallbackAccounts);

  const fallbackCostCenters = SEED_COST_CENTERS.filter(
    (center) => center.systemKey === FALLBACK_COST_CENTER_KEY,
  );
  await writeCostCenters(prisma, organizationId, fallbackCostCenters);

  const [receivableAccount, payableAccount, costCenter] = await Promise.all([
    prisma.chartOfAccount.findFirst({
      where: { organizationId, systemKey: RECEIVABLE_FALLBACK_ACCOUNT_KEY },
      select: { id: true },
    }),
    prisma.chartOfAccount.findFirst({
      where: { organizationId, systemKey: PAYABLE_FALLBACK_ACCOUNT_KEY },
      select: { id: true },
    }),
    prisma.costCenter.findFirst({
      where: { organizationId, systemKey: FALLBACK_COST_CENTER_KEY },
      select: { id: true },
    }),
  ]);

  if (!receivableAccount || !payableAccount || !costCenter) return null;

  return {
    receivableAccountId: receivableAccount.id,
    payableAccountId: payableAccount.id,
    costCenterId: costCenter.id,
  };
}

async function backfillOrganization(
  prisma: PrismaService,
  organizationId: string,
): Promise<{ migrated: number; fallback: number }> {
  const fallback = await ensureFallbackData(prisma, organizationId);
  if (!fallback) {
    console.warn(
      `[backfill] organização ${organizationId}: não foi possível garantir as contas/centro de fallback — pulando`,
    );
    return { migrated: 0, fallback: 0 };
  }

  const entries = await prisma.financialEntry.findMany({
    where: { organizationId, allocations: { none: {} } },
    select: {
      id: true,
      operation: true,
      categoryName: true,
      amountCents: true,
      feesCents: true,
      finesCents: true,
    },
  });
  if (entries.length === 0) return { migrated: 0, fallback: 0 };

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, name: true },
  });
  const accountIdByNormalizedName = new Map(
    accounts.map((account) => [normalizeAccountName(account.name), account.id]),
  );

  let fallbackCount = 0;
  for (const entry of entries) {
    const totalCents = entry.amountCents + entry.feesCents + entry.finesCents;
    const matchedAccountId = accountIdByNormalizedName.get(
      normalizeAccountName(entry.categoryName),
    );
    if (!matchedAccountId) fallbackCount += 1;

    const chartOfAccountId =
      matchedAccountId ??
      (entry.operation === 'payable'
        ? fallback.payableAccountId
        : fallback.receivableAccountId);

    await prisma.financialEntryAllocation.create({
      data: {
        organizationId,
        financialEntryId: entry.id,
        chartOfAccountId,
        costCenterId: fallback.costCenterId,
        amountCents: totalCents,
        percentage: 100,
      },
    });
  }

  return { migrated: entries.length, fallback: fallbackCount };
}

async function main(): Promise<void> {
  const context = await NestFactory.createApplicationContext(
    BackfillScriptModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    // Acesso cru (não `.scoped`) de propósito: script cross-organização, sem
    // contexto de tenant de requisição — cada query já filtra por
    // `organizationId` explicitamente.
    const prisma = context.get(PrismaService);
    const organizations = await prisma.organization.findMany({
      select: { id: true },
    });

    let totalMigrated = 0;
    let totalFallback = 0;
    for (const { id: organizationId } of organizations) {
      const result = await backfillOrganization(prisma, organizationId);
      totalMigrated += result.migrated;
      totalFallback += result.fallback;
      if (result.migrated > 0) {
        console.log(
          `[backfill] organização ${organizationId}: ${result.migrated} lançamento(s) migrado(s) · ${result.fallback} no fallback`,
        );
      }
    }

    console.log(
      `[backfill] concluído — ${organizations.length} organização(ões) · ${totalMigrated} lançamento(s) migrado(s) · ${totalFallback} no fallback`,
    );
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
