import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  UnitOfMeasureRepository,
  type UnitOfMeasureListCriteria,
} from '../../domain/repositories/unit-of-measure.repository.interface';
import {
  UnitOfMeasure,
  type UnitKind,
  type UnitOfMeasureProps,
} from '../../domain/entities/unit-of-measure.entity';

type UnitOfMeasureRow = {
  id: string;
  organizationId: string;
  name: string;
  abbreviation: string;
  kind: string;
  decimalPlaces: number;
  active: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaUnitOfMeasureRepository extends UnitOfMeasureRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<UnitOfMeasure | null> {
    const row = await this.prisma.scoped.unitOfMeasure.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByAbbreviation(
    organizationId: string,
    abbreviation: string,
  ): Promise<UnitOfMeasure | null> {
    const trimmed = abbreviation.trim();
    if (!trimmed) return null;

    const row = await this.prisma.scoped.unitOfMeasure.findFirst({
      where: {
        organizationId,
        abbreviation: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: UnitOfMeasureListCriteria = {},
  ): Promise<UnitOfMeasure[]> {
    const rows = await this.prisma.scoped.unitOfMeasure.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Pick<UnitOfMeasureListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.unitOfMeasure.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(unit: UnitOfMeasure): Promise<UnitOfMeasure> {
    const data = {
      organizationId: unit.organizationId,
      name: unit.name,
      abbreviation: unit.abbreviation,
      kind: unit.kind,
      decimalPlaces: unit.decimalPlaces,
      active: unit.active,
      updatedAt: unit.updatedAt,
    };

    const row = await this.prisma.scoped.unitOfMeasure.upsert({
      where: { id: unit.id },
      create: { id: unit.id, ...data, createdAt: unit.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.unitOfMeasure.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<UnitOfMeasureListCriteria, 'activeOnly' | 'search'>,
  ): Prisma.UnitOfMeasureWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.activeOnly ? { active: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { abbreviation: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private toEntity(row: UnitOfMeasureRow): UnitOfMeasure {
    const props: UnitOfMeasureProps = {
      organizationId: row.organizationId,
      name: row.name,
      abbreviation: row.abbreviation,
      kind: row.kind as UnitKind,
      decimalPlaces: row.decimalPlaces,
      active: row.active,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return UnitOfMeasure.with(props, row.id);
  }
}
