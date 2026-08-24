import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  OrganizationRepository,
  StoreRepository,
  type OrganizationRecord,
  type StoreRecord,
} from '../../domain/repositories/tenancy.repositories';

@Injectable()
export class PrismaOrganizationRepository extends OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          name: row.name,
          status: row.status,
        }
      : null;
  }

  async findByStoreId(storeId: string): Promise<OrganizationRecord | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { organization: true },
    });
    if (!store) return null;
    return {
      id: store.organization.id,
      name: store.organization.name,
      status: store.organization.status,
    };
  }

  async ensureForPlatformStore(input: {
    storeId: string;
    name: string;
  }): Promise<{ organization: OrganizationRecord; store: StoreRecord }> {
    const name = input.name.trim() || 'Estabelecimento Beautiful';
    const existing = await this.prisma.store.findUnique({
      where: { id: input.storeId },
      include: { organization: true },
    });

    if (existing) {
      const [org, store] = await this.prisma.$transaction([
        this.prisma.organization.update({
          where: { id: existing.organizationId },
          data: { name },
        }),
        this.prisma.store.update({
          where: { id: input.storeId },
          data: { name, status: 'active' },
        }),
      ]);
      return {
        organization: {
          id: org.id,
          name: org.name,
          status: org.status,
        },
        store: {
          id: store.id,
          organizationId: store.organizationId,
          name: store.name,
          status: store.status,
        },
      };
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, status: 'active' },
      });
      const store = await tx.store.create({
        data: {
          id: input.storeId,
          organizationId: org.id,
          name,
          status: 'active',
        },
      });
      return { org, store };
    });

    return {
      organization: {
        id: created.org.id,
        name: created.org.name,
        status: created.org.status,
      },
      store: {
        id: created.store.id,
        organizationId: created.store.organizationId,
        name: created.store.name,
        status: created.store.status,
      },
    };
  }
}

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<StoreRecord | null> {
    const row = await this.prisma.store.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          name: row.name,
          status: row.status,
        }
      : null;
  }
}
