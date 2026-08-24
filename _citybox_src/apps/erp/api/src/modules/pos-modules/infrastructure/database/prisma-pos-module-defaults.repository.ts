import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PosModuleDefaults,
  type PosModuleDefaultsProps,
} from '../../domain/entities/pos-module-defaults.entity';
import { PosModuleDefaultsRepository } from '../../domain/repositories/pos-module-defaults.repository.interface';
import { sanitizeModuleStates } from '../../domain/services/resolve-terminal-modules';

type PosModuleDefaultsRow = {
  id: string;
  organizationId: string;
  profileName: string | null;
  modules: unknown;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPosModuleDefaultsRepository extends PosModuleDefaultsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<PosModuleDefaults | null> {
    const row = await this.prisma.scoped.posModuleDefaults.findFirst({
      where: { organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(defaults: PosModuleDefaults): Promise<PosModuleDefaults> {
    const data = {
      organizationId: defaults.organizationId,
      profileName: defaults.profileName,
      modules: defaults.modules,
      updatedAt: defaults.updatedAt,
    };

    const row = await this.prisma.scoped.posModuleDefaults.upsert({
      where: { id: defaults.id },
      create: { id: defaults.id, ...data, createdAt: defaults.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: PosModuleDefaultsRow): PosModuleDefaults {
    const props: PosModuleDefaultsProps = {
      organizationId: row.organizationId,
      profileName: row.profileName,
      // ⚠️ Higieniza **na leitura**, não só na escrita: a coluna é `Json` e o
      // banco não valida nada. Uma linha editada à mão não pode virar estado.
      modules: sanitizeModuleStates(
        row.modules as Record<string, unknown> | null,
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PosModuleDefaults.with(props, row.id);
  }
}
