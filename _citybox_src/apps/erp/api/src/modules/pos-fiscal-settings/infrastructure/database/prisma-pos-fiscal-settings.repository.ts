import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PosFiscalSettings,
  type PosDocumentModel,
  type PosFiscalSettingsProps,
} from '../../domain/entities/pos-fiscal-settings.entity';
import { PosFiscalSettingsRepository } from '../../domain/repositories/pos-fiscal-settings.repository.interface';

type Row = {
  id: string;
  organizationId: string;
  posDocumentModel: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPosFiscalSettingsRepository extends PosFiscalSettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<PosFiscalSettings | null> {
    const row = await this.prisma.scoped.posFiscalSettings.findFirst({
      where: { organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(settings: PosFiscalSettings): Promise<PosFiscalSettings> {
    const data = {
      organizationId: settings.organizationId,
      posDocumentModel: settings.posDocumentModel,
      updatedByUserId: settings.updatedByUserId,
      updatedAt: settings.updatedAt,
    };

    const row = await this.prisma.scoped.posFiscalSettings.upsert({
      where: { id: settings.id },
      create: { id: settings.id, ...data, createdAt: settings.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: Row): PosFiscalSettings {
    const props: PosFiscalSettingsProps = {
      organizationId: row.organizationId,
      posDocumentModel: row.posDocumentModel as PosDocumentModel | null,
      updatedByUserId: row.updatedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PosFiscalSettings.with(props, row.id);
  }
}
