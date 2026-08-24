import { Injectable } from '@nestjs/common';
import { toErpVerticalSlug } from '../../../stores/domain/catalog/store-vertical.catalog';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { MyStoreView } from '../../domain/my-store.view';

@Injectable()
export class BackofficeStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStoresForMember(keycloakSub: string): Promise<MyStoreView[]> {
    const rows = await this.prisma.storeMember.findMany({
      where: {
        member: { keycloakSub },
        store: { status: { not: 'BLOCKED' } },
      },
      select: {
        store: {
          select: {
            id: true,
            tradeName: true,
            slug: true,
            vertical: true,
            responsibleName: true,
          },
        },
      },
      orderBy: { store: { tradeName: 'asc' } },
    });

    return rows.map((row) => ({
      id: row.store.id,
      name: row.store.tradeName,
      slug: row.store.slug,
      vertical: toErpVerticalSlug(row.store.vertical),
      // A loja É o cliente desde o PLAT-001 — daí `clientId` ser o id dela.
      clientId: row.store.id,
      clientName: row.store.responsibleName ?? row.store.tradeName,
    }));
  }
}
