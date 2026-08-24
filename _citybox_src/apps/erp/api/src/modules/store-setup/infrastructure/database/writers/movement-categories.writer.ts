import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type { SeedMovementCategory } from '../../../application/seed-data/seed-template.types';

/**
 * Categorias de movimentação + vínculo com as unidades.
 *
 * O vínculo é reafirmado a cada execução de propósito: unidade criada depois do
 * provisionamento ficaria sem nenhuma categoria no select, e a tela de movimentação abriria
 * vazia mesmo com as categorias existindo na empresa.
 */
export async function writeMovementCategories(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedMovementCategory[],
  branchIds: readonly string[],
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.movementCategory.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { code: item.code }],
      },
      select: { id: true },
    });

    const category = existing
      ? await prisma.movementCategory.update({
          where: { id: existing.id },
          data: { systemKey: item.systemKey, isSystem: true, type: item.type },
          select: { id: true },
        })
      : await prisma.movementCategory.create({
          data: {
            organizationId,
            code: item.code,
            name: item.name,
            type: item.type,
            systemKey: item.systemKey,
            isSystem: true,
          },
          select: { id: true },
        });

    for (const branchId of branchIds) {
      await prisma.movementCategoryBranch.upsert({
        where: {
          movementCategoryId_branchId: {
            movementCategoryId: category.id,
            branchId,
          },
        },
        create: {
          organizationId,
          movementCategoryId: category.id,
          branchId,
        },
        update: {},
      });
    }
  }
}
