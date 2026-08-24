import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { StoreSettingsEntity } from '../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../domain/repositories/store-settings.repository.interface';
import { StoreSettings as PrismaStoreSettings } from '../../../../../generated/prisma/client';
import type { WorkIntervalRow } from '../../../../shared/domain/work-schedule/work-schedule.types';

@Injectable()
export class PrismaStoreSettingsRepository implements StoreSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaStoreSettings): StoreSettingsEntity {
    return StoreSettingsEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        themeId: raw.themeId,
        cnpj: raw.cnpj,
        communicationsName: raw.communicationsName,
        responsible: raw.responsible,
        email: raw.email,
        phone: raw.phone,
        mobile: raw.mobile,
        cep: raw.cep,
        street: raw.street,
        number: raw.number,
        complement: raw.complement,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        logoObjectKey: raw.logoObjectKey,
        logoMimeType: raw.logoMimeType,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async getOrCreateDefault(storeId: string): Promise<StoreSettingsEntity> {
    const existing = await this.prisma.storeSettings.findUnique({
      where: { storeId },
    });
    if (existing) return this.toDomain(existing);

    const created = StoreSettingsEntity.create({
      storeId,
      name: 'Meu estabelecimento',
    });
    await this.save(created);
    return created;
  }

  async save(settings: StoreSettingsEntity): Promise<void> {
    await this.prisma.storeSettings.upsert({
      where: { storeId: settings.storeId },
      create: {
        id: settings.id,
        storeId: settings.storeId,
        name: settings.name,
        themeId: settings.themeId,
        cnpj: settings.cnpj,
        communicationsName: settings.communicationsName,
        responsible: settings.responsible,
        email: settings.email,
        phone: settings.phone,
        mobile: settings.mobile,
        cep: settings.cep,
        street: settings.street,
        number: settings.number,
        complement: settings.complement,
        neighborhood: settings.neighborhood,
        city: settings.city,
        state: settings.state,
        logoObjectKey: settings.logoObjectKey,
        logoMimeType: settings.logoMimeType,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
      update: {
        name: settings.name,
        themeId: settings.themeId,
        cnpj: settings.cnpj,
        communicationsName: settings.communicationsName,
        responsible: settings.responsible,
        email: settings.email,
        phone: settings.phone,
        mobile: settings.mobile,
        cep: settings.cep,
        street: settings.street,
        number: settings.number,
        complement: settings.complement,
        neighborhood: settings.neighborhood,
        city: settings.city,
        state: settings.state,
        logoObjectKey: settings.logoObjectKey,
        logoMimeType: settings.logoMimeType,
        updatedAt: settings.updatedAt,
      },
    });
  }

  async findWorkIntervals(storeSettingsId: string): Promise<WorkIntervalRow[]> {
    const rows = await this.prisma.storeWorkInterval.findMany({
      where: { storeSettingsId },
      orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
    });

    return rows.map((row) => ({
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      sortOrder: row.sortOrder,
    }));
  }

  async replaceWorkIntervals(
    storeSettingsId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.storeWorkInterval.deleteMany({ where: { storeSettingsId } });

      if (intervals.length > 0) {
        await tx.storeWorkInterval.createMany({
          data: intervals.map((interval) => ({
            storeSettingsId,
            weekday: interval.weekday,
            startTime: interval.startTime,
            endTime: interval.endTime,
            sortOrder: interval.sortOrder,
          })),
        });
      }
    });
  }
}
