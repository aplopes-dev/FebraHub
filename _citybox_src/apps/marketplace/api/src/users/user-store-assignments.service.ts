import { Inject, Injectable } from '@nestjs/common';
import type { PlatformPrisma } from '../database/platform.js';
import { PLATFORM_PRISMA } from '../platform/platform.module.js';

export type UserStoreView = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
};

/** @deprecated Backoffice/ERP usa platform-api (`GET /v1/users/me/stores`). Mantido para compatibilidade legada. */
@Injectable()
export class UserStoreAssignmentsService {
  constructor(@Inject(PLATFORM_PRISMA) private readonly platform: PlatformPrisma) {}

  /** Lista lojas vinculadas exclusivamente ao `keycloakSub` autenticado (sem merge por e-mail). */
  async listForUser(keycloakSub: string): Promise<UserStoreView[]> {
    const rows = await this.platform.$queryRaw<
      Array<{ id: string; name: string; slug: string; vertical: string }>
    >`
      SELECT
        s.id,
        s.trade_name AS name,
        s.slug,
        LOWER(s.vertical) AS vertical
      FROM platform.store_members sm
      INNER JOIN platform.stores s ON s.id = sm.store_id
      WHERE sm.keycloak_sub = ${keycloakSub}
        AND s.status != 'bloqueada'
      ORDER BY s.trade_name ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      vertical: row.vertical === 'food' ? 'food' : row.vertical === 'varejo' ? 'varejo' : row.vertical,
    }));
  }
}
