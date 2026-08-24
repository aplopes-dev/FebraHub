import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PatientCategoryRepository } from '../../domain/repositories/patient-category.repository.interface';
import {
  PatientCategory,
  type PatientCategoryProps,
} from '../../domain/entities/patient-category.entity';

type PatientCategoryRow = {
  id: string;
  storeId: string;
  name: string;
  colorId: string;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientCategoryRepository extends PatientCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<PatientCategory | null> {
    const row = await this.prisma.patientCategory.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<PatientCategory | null> {
    const row = await this.prisma.patientCategory.findFirst({
      where: { storeId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findProtected(storeId: string): Promise<PatientCategory | null> {
    const row = await this.prisma.patientCategory.findFirst({
      where: { storeId, isProtected: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(storeId: string): Promise<PatientCategory[]> {
    const rows = await this.prisma.patientCategory.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async countPatients(storeId: string, categoryId: string): Promise<number> {
    return this.prisma.patient.count({
      where: { storeId, categoryId },
    });
  }

  async save(category: PatientCategory): Promise<PatientCategory> {
    const row = await this.prisma.patientCategory.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        storeId: category.storeId,
        name: category.name,
        colorId: category.colorId,
        isProtected: category.isProtected,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      update: {
        name: category.name,
        colorId: category.colorId,
        isProtected: category.isProtected,
        updatedAt: category.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.patientCategory.deleteMany({ where: { id, storeId } });
  }

  private toEntity(row: PatientCategoryRow): PatientCategory {
    const props: PatientCategoryProps = {
      storeId: row.storeId,
      name: row.name,
      colorId: row.colorId,
      isProtected: row.isProtected,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PatientCategory.with(props, row.id);
  }
}
