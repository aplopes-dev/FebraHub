import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { SYSTEM_PROFILE_ADMINISTRADOR } from '../../../../../shared/infra/http/permissions/fine-to-coarse';
import type { SeedPermissionProfile } from '../../../application/seed-data/seed-template.types';

/**
 * Upsert dos perfis seedados por `systemKey`.
 *
 * Só o Administrador é `isSystem` (imutável). Os demais nascem no provisionamento
 * para o ERP já ser utilizável, mas o lojista pode editar/excluir — no update,
 * preservamos nome/descrição/`permissionIds` customizados e só sincronizamos
 * `isSystem`/`systemKey` (migração v3: destravar perfis que nasceram todos
 * bloqueados). Após o upsert, vincula memberships legados com
 * `permissionProfileId` nulo ao perfil `administrador`.
 */
export async function writePermissionProfiles(
  prisma: PrismaService,
  organizationId: string,
  items: readonly SeedPermissionProfile[],
): Promise<void> {
  const now = new Date();
  let adminProfileId: string | null = null;

  for (const item of items) {
    const existing = await prisma.permissionProfile.findFirst({
      where: {
        organizationId,
        OR: [{ systemKey: item.systemKey }, { name: item.name }],
      },
      select: { id: true },
    });

    let profileId: string;

    if (existing) {
      await prisma.permissionProfile.update({
        where: { id: existing.id },
        data: {
          systemKey: item.systemKey,
          isSystem: item.isSystem,
          // Perfil travado acompanha o catálogo; editáveis preservam customização.
          ...(item.isSystem
            ? {
                description: item.description,
                permissionIds: [...item.permissionIds],
                deletedAt: null,
              }
            : {}),
          updatedAt: now,
        },
      });
      profileId = existing.id;
    } else {
      const created = await prisma.permissionProfile.create({
        data: {
          organizationId,
          name: item.name,
          description: item.description,
          isSystem: item.isSystem,
          systemKey: item.systemKey,
          permissionIds: [...item.permissionIds],
          updatedAt: now,
        },
      });
      profileId = created.id;
    }

    if (item.systemKey === SYSTEM_PROFILE_ADMINISTRADOR) {
      adminProfileId = profileId;
    }
  }

  if (!adminProfileId) return;

  await prisma.membership.updateMany({
    where: { organizationId, permissionProfileId: null },
    data: { permissionProfileId: adminProfileId, updatedAt: now },
  });
}
