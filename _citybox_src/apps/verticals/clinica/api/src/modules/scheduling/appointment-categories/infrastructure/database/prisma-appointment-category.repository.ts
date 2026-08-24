import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  AppointmentCategory,
  type AppointmentCategoryProps,
} from '../../domain/entities/appointment-category.entity';
import {
  AppointmentCategoryRepository,
  type AppointmentCategoryListCriteria,
  type AppointmentCategoryListItem,
} from '../../domain/repositories/appointment-category.repository.interface';

@Injectable()
export class PrismaAppointmentCategoryRepository extends AppointmentCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategory | null> {
    const row = await this.prisma.appointmentCategory.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategory | null> {
    const row = await this.prisma.appointmentCategory.findFirst({
      where: { storeId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: AppointmentCategoryListCriteria,
  ): Promise<AppointmentCategoryListItem[]> {
    const where = this.buildWhere(storeId, criteria);
    const orderBy = this.buildOrderBy(criteria);
    const rows = await this.prisma.appointmentCategory.findMany({
      where,
      orderBy,
      skip: criteria.skip,
      take: criteria.take,
      include: { _count: { select: { appointments: true } } },
    });

    return rows.map((row) => ({
      category: this.toEntity(row),
      appointmentCount: row._count.appointments,
    }));
  }

  async count(
    storeId: string,
    criteria: Omit<AppointmentCategoryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.appointmentCategory.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async countAppointments(
    storeId: string,
    categoryId: string,
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: { storeId, categoryId },
    });
  }

  async save(category: AppointmentCategory): Promise<AppointmentCategory> {
    const row = await this.prisma.appointmentCategory.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        storeId: category.storeId,
        name: category.name,
        color: category.color,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      update: {
        name: category.name,
        color: category.color,
        updatedAt: category.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.appointmentCategory.deleteMany({
      where: { id, storeId },
    });
  }

  private buildWhere(
    storeId: string,
    criteria: Omit<AppointmentCategoryListCriteria, 'skip' | 'take'>,
  ): Prisma.AppointmentCategoryWhereInput {
    const search = criteria.search?.trim();
    return {
      storeId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private buildOrderBy(
    criteria: AppointmentCategoryListCriteria,
  ): Prisma.AppointmentCategoryOrderByWithRelationInput {
    const sortOrder = criteria.sortOrder ?? 'asc';
    if (criteria.sortBy === 'createdAt') {
      return { createdAt: sortOrder };
    }
    return { name: sortOrder };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }): AppointmentCategory {
    const props: AppointmentCategoryProps = {
      storeId: row.storeId,
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return AppointmentCategory.with(props, row.id);
  }
}
