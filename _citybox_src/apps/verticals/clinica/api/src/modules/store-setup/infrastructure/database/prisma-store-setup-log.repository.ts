import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { StoreSetupLogRepository } from '../../domain/repositories/store-setup-log.repository.interface';
import { StoreSetupLog } from '../../domain/entities/store-setup-log.entity';

@Injectable()
export class PrismaStoreSetupLogRepository extends StoreSetupLogRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<StoreSetupLog | null> {
    const row = await this.prisma.clinicStoreSetup.findUnique({
      where: { storeId },
    });
    return row
      ? StoreSetupLog.create({
          storeId: row.storeId,
          version: row.version,
          completedAt: row.completedAt,
        })
      : null;
  }

  async save(log: StoreSetupLog): Promise<StoreSetupLog> {
    const row = await this.prisma.clinicStoreSetup.upsert({
      where: { storeId: log.storeId },
      create: {
        storeId: log.storeId,
        version: log.version,
        completedAt: log.completedAt,
      },
      update: {
        version: log.version,
        completedAt: log.completedAt,
      },
    });
    return StoreSetupLog.create({
      storeId: row.storeId,
      version: row.version,
      completedAt: row.completedAt,
    });
  }
}
