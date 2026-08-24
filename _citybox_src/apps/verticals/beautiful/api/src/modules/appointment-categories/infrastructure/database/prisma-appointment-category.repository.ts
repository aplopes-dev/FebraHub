import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { AppointmentCategoryEntity } from '../../domain/entities/appointment-category.entity';
import { AppointmentCategoryRepository } from '../../domain/repositories/appointment-category.repository.interface';
import { AppointmentCategory as PrismaAppointmentCategory } from '../../../../../generated/prisma/client';

@Injectable()
export class PrismaAppointmentCategoryRepository implements AppointmentCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaAppointmentCategory): AppointmentCategoryEntity {
    return AppointmentCategoryEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        color: raw.color,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(category: AppointmentCategoryEntity): Promise<void> {
    await this.prisma.appointmentCategory.upsert({
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
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategoryEntity | null> {
    const raw = await this.prisma.appointmentCategory.findFirst({
      where: { id, storeId },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategoryEntity | null> {
    const raw = await this.prisma.appointmentCategory.findFirst({
      where: { storeId, name },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(storeId: string): Promise<AppointmentCategoryEntity[]> {
    const list = await this.prisma.appointmentCategory.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return list.map((item) => this.toDomain(item));
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.appointmentCategory.deleteMany({
      where: { id, storeId },
    });
  }

  async countAppointments(
    storeId: string,
    categoryId: string,
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: { categoryId, storeId },
    });
  }
}
