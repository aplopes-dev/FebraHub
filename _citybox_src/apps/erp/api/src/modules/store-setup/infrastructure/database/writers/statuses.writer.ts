import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type {
  SeedContractStatus,
  SeedServiceOrderStatus,
} from '../../../application/seed-data/seed-template.types';

/**
 * Status não têm unique de nome no banco, então a adoção casa por nome exato para não
 * duplicar o que a listagem de OS já criava sob demanda antes deste módulo.
 */
export async function writeServiceOrderStatuses(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedServiceOrderStatus[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.serviceOrderStatus.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.serviceOrderStatus.update({
        where: { id: existing.id },
        data: {
          systemKey: item.systemKey,
          isSystem: true,
          baseType: item.baseType,
          active: true,
        },
      });
      continue;
    }

    await prisma.serviceOrderStatus.create({
      data: {
        organizationId,
        name: item.name,
        baseType: item.baseType,
        sortOrder: item.sortOrder,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writeContractStatuses(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedContractStatus[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.contractStatus.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.contractStatus.update({
        where: { id: existing.id },
        data: { systemKey: item.systemKey, isSystem: true, active: true },
      });
      continue;
    }

    await prisma.contractStatus.create({
      data: {
        organizationId,
        name: item.name,
        sortOrder: item.sortOrder,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}
