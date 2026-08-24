import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlatformPrisma } from '../database/platform.js';
import { resolvePermissions, type PermissionUser } from '../common/permissions.js';
import { PLATFORM_PRISMA } from '../platform/platform.module.js';

@Injectable()
export class StoreAccessService {
  constructor(@Inject(PLATFORM_PRISMA) private readonly platform: PlatformPrisma) {}

  async assertUserCanAccessStore(
    user: PermissionUser & { sub: string },
    storeId: string,
  ): Promise<void> {
    const perms = resolvePermissions(user);
    if (perms.includes('platform.admin')) return;

    const storeExists = await this.platform.$queryRaw<Array<{ id: string }>>`
      SELECT s.id
      FROM platform.stores s
      WHERE s.id = ${storeId}
      LIMIT 1
    `;
    if (storeExists.length === 0) {
      throw new NotFoundException('Loja não encontrada');
    }

    const membership = await this.platform.$queryRaw<Array<{ id: string }>>`
      SELECT sm.id
      FROM platform.store_members sm
      INNER JOIN platform.stores s ON s.id = sm.store_id
      WHERE sm.store_id = ${storeId}
        AND sm.keycloak_sub = ${user.sub}
        AND s.status != 'bloqueada'
      LIMIT 1
    `;
    if (membership.length === 0) {
      throw new ForbiddenException('Usuário sem vínculo com esta loja');
    }
  }
}
