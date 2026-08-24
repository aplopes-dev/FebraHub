import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { MunicipalParametersRepository } from '../../domain/repositories/municipal-parameters.repository.interface';
import { MunicipalParameters } from '../../domain/entities/municipal-parameters.entity';

type MunicipalParametersRow = {
  id: string;
  cityCodeIbge: string;
  parameters: unknown;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaMunicipalParametersRepository extends MunicipalParametersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByCityCode(
    cityCodeIbge: string,
  ): Promise<MunicipalParameters | null> {
    const row = await this.prisma.municipalParameters.findUnique({
      where: { cityCodeIbge },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(entity: MunicipalParameters): Promise<MunicipalParameters> {
    // Upsert por `cityCodeIbge` (unique), não por id: o refresh do cache não
    // conhece o id da linha anterior, e criar uma segunda linha para o mesmo
    // município violaria o unique de qualquer forma.
    const data = {
      cityCodeIbge: entity.cityCodeIbge,
      parameters: entity.parameters as Prisma.InputJsonObject,
      fetchedAt: entity.fetchedAt,
    };

    const row = await this.prisma.municipalParameters.upsert({
      where: { cityCodeIbge: entity.cityCodeIbge },
      create: { id: entity.id, ...data },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: MunicipalParametersRow): MunicipalParameters {
    return MunicipalParameters.with(
      {
        cityCodeIbge: row.cityCodeIbge,
        parameters: (row.parameters ?? {}) as Record<string, unknown>,
        fetchedAt: row.fetchedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
