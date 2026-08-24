import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type {
  SeedProductCategory,
  SeedStock,
  SeedUnitOfMeasure,
} from '../../../application/seed-data/seed-template.types';

/**
 * Cada bloco segue a mesma ordem: procurar por `systemKey`, adotar o registro equivalente
 * criado antes desta feature (chave natural) e só então criar.
 *
 * A adoção não é detalhe: as organizações que já existiam têm "Unidade", "Geral" e
 * "Estoque Loja" sem `systemKey`, e criar de novo esbarraria no unique de nome/sigla.
 */
export async function writeUnitsOfMeasure(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedUnitOfMeasure[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.unitOfMeasure.findFirst({
      where: {
        organizationId,
        OR: [
          { systemKey: item.systemKey },
          { abbreviation: item.abbreviation },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.unitOfMeasure.update({
        where: { id: existing.id },
        data: {
          systemKey: item.systemKey,
          isSystem: true,
          kind: item.kind,
          active: true,
        },
      });
      continue;
    }

    await prisma.unitOfMeasure.create({
      data: {
        organizationId,
        name: item.name,
        abbreviation: item.abbreviation,
        kind: item.kind,
        decimalPlaces: item.decimalPlaces,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writeProductCategories(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedProductCategory[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.productCategory.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.productCategory.update({
        where: { id: existing.id },
        data: { systemKey: item.systemKey, isSystem: true, active: true },
      });
      continue;
    }

    await prisma.productCategory.create({
      data: {
        organizationId,
        name: item.name,
        systemKey: item.systemKey,
        isSystem: true,
      },
    });
  }
}

export async function writeStocks(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedStock[],
  branchIds: readonly string[],
): Promise<void> {
  for (const item of items) {
    // `isDefault` entra na busca porque o depósito padrão já existia antes do `systemKey`,
    // e pode ter sido renomeado pelo lojista — o nome não serve de âncora aqui.
    const existing = await prisma.stock.findFirst({
      where: {
        organizationId,
        OR: [
          { systemKey: item.systemKey },
          ...(item.isDefault ? [{ isDefault: true }] : [{ name: item.name }]),
        ],
      },
      select: { id: true },
    });

    const stock = existing
      ? await prisma.stock.update({
          where: { id: existing.id },
          data: {
            systemKey: item.systemKey,
            isSystem: true,
            isDefault: item.isDefault,
          },
          select: { id: true },
        })
      : await prisma.stock.create({
          data: {
            organizationId,
            name: item.name,
            location: item.location,
            property: item.property,
            isDefault: item.isDefault,
            systemKey: item.systemKey,
            isSystem: true,
          },
          select: { id: true },
        });

    for (const branchId of branchIds) {
      await prisma.stockBranch.upsert({
        where: { stockId_branchId: { stockId: stock.id, branchId } },
        create: { organizationId, stockId: stock.id, branchId },
        update: {},
      });
    }
  }
}
