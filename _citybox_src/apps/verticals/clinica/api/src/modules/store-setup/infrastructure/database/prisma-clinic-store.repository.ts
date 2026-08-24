import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ClinicStoreRepository } from '../../domain/repositories/clinic-store.repository.interface';
import { ClinicStore } from '../../domain/entities/clinic-store.entity';

@Injectable()
export class PrismaClinicStoreRepository extends ClinicStoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string): Promise<ClinicStore | null> {
    const row = await this.prisma.clinicStore.findUnique({ where: { storeId } });
    return row ? this.toEntity(row) : null;
  }

  async save(store: ClinicStore): Promise<ClinicStore> {
    const row = await this.prisma.clinicStore.upsert({
      where: { storeId: store.storeId },
      create: {
        storeId: store.storeId,
        tradeName: store.tradeName,
        legalName: store.legalName,
        slug: store.slug,
        vertical: store.vertical,
        document: store.document,
        stateRegistration: store.stateRegistration,
        usesClientDocument: store.usesClientDocument,
        zipCode: store.zipCode,
        street: store.street,
        number: store.number,
        complement: store.complement,
        neighborhood: store.neighborhood,
        city: store.city,
        state: store.state,
        phone: store.phone,
        timezone: store.timezone,
        platformUpdatedAt: store.platformUpdatedAt,
        syncedAt: store.syncedAt,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
      update: {
        tradeName: store.tradeName,
        legalName: store.legalName,
        slug: store.slug,
        vertical: store.vertical,
        document: store.document,
        stateRegistration: store.stateRegistration,
        usesClientDocument: store.usesClientDocument,
        zipCode: store.zipCode,
        street: store.street,
        number: store.number,
        complement: store.complement,
        neighborhood: store.neighborhood,
        city: store.city,
        state: store.state,
        phone: store.phone,
        timezone: store.timezone,
        platformUpdatedAt: store.platformUpdatedAt,
        syncedAt: store.syncedAt,
        updatedAt: store.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: {
    storeId: string;
    tradeName: string;
    legalName: string | null;
    slug: string;
    vertical: string;
    document: string | null;
    stateRegistration: string | null;
    usesClientDocument: boolean;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    timezone: string;
    platformUpdatedAt: Date;
    syncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ClinicStore {
    return ClinicStore.with({
      storeId: row.storeId,
      tradeName: row.tradeName,
      legalName: row.legalName,
      slug: row.slug,
      vertical: row.vertical,
      document: row.document,
      stateRegistration: row.stateRegistration,
      usesClientDocument: row.usesClientDocument,
      zipCode: row.zipCode,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      phone: row.phone,
      timezone: row.timezone,
      platformUpdatedAt: row.platformUpdatedAt,
      syncedAt: row.syncedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
