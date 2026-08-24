import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type {
  SeedChartOfAccount,
  SeedCostCenter,
  SeedFinancialGroup,
  SeedPaymentMethod,
} from '../../../application/seed-data/seed-template.types';

/**
 * Os três cadastros financeiros usam soft delete, e o unique de nome conta o registro
 * excluído. Por isso a adoção limpa `deletedAt`: sem restaurar, não há como recriar o
 * registro de sistema que alguém apagou antes desta proteção existir.
 */
export async function writeFinancialGroups(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedFinancialGroup[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.financialGroup.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.financialGroup.update({
        where: { id: existing.id },
        data: {
          // `name` de propósito não é regravado aqui: um grupo de sistema
          // permite renomear via API (FR do CRUD de grupo financeiro), e
          // reaplicar o seed não deve reverter essa escolha do usuário.
          systemKey: item.systemKey,
          isSystem: true,
          type: item.type,
          classification: item.classification,
          catalogOrder: item.catalogOrder ?? 0,
          sign: item.sign ?? null,
          deletedAt: null,
        },
      });
      continue;
    }

    await prisma.financialGroup.create({
      data: {
        organizationId,
        name: item.name,
        type: item.type,
        classification: item.classification,
        catalogOrder: item.catalogOrder ?? 0,
        sign: item.sign ?? null,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writeChartOfAccounts(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedChartOfAccount[],
): Promise<void> {
  const groups = await prisma.financialGroup.findMany({
    where: { organizationId, systemKey: { not: null } },
    select: { id: true, systemKey: true },
  });
  const groupIdByKey = new Map(
    groups.map((group) => [group.systemKey as string, group.id]),
  );

  for (const item of items) {
    const financialGroupId = groupIdByKey.get(item.financialGroupKey);
    // Grupo ausente só acontece se o template referenciar uma chave que não existe — o
    // teste do template cobre isso. Pular é melhor do que abortar o provisionamento inteiro.
    if (!financialGroupId) continue;

    const existing = await prisma.chartOfAccount.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.chartOfAccount.update({
        where: { id: existing.id },
        data: {
          systemKey: item.systemKey,
          isSystem: true,
          financialGroupId,
          deletedAt: null,
        },
      });
      continue;
    }

    await prisma.chartOfAccount.create({
      data: {
        organizationId,
        name: item.name,
        financialGroupId,
        availableForPdv: item.availableForPdv,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writePaymentMethods(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedPaymentMethod[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.paymentMethod.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.paymentMethod.update({
        where: { id: existing.id },
        data: { systemKey: item.systemKey, isSystem: true, deletedAt: null },
      });
      continue;
    }

    await prisma.paymentMethod.create({
      data: {
        organizationId,
        name: item.name,
        fiscalCode: item.fiscalCode ?? null,
        installmentPermission: item.installmentPermission ?? null,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writeCostCenters(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedCostCenter[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.costCenter.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.costCenter.update({
        where: { id: existing.id },
        data: { systemKey: item.systemKey, isSystem: true, deletedAt: null },
      });
      continue;
    }

    await prisma.costCenter.create({
      data: {
        organizationId,
        name: item.name,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}
