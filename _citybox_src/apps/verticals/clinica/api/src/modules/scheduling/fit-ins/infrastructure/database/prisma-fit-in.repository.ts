import { Injectable } from '@nestjs/common';
import {
  FitInShift,
  FitInStatus,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { FitIn, type FitInProps } from '../../domain/entities/fit-in.entity';
import type { FitInStatus as DomainFitInStatus } from '../../../shared/domain/scheduling-enums';
import {
  FitInRepository,
  type FitInDetail,
  type FitInListCriteria,
} from '../../domain/repositories/fit-in.repository.interface';

@Injectable()
export class PrismaFitInRepository extends FitInRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<FitInDetail | null> {
    const row = await this.prisma.fitIn.findFirst({
      where: { id, storeId },
      include: this.includeRelations(),
    });
    return row ? this.toDetail(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: FitInListCriteria,
  ): Promise<FitInDetail[]> {
    const rows = await this.prisma.fitIn.findMany({
      where: this.buildWhere(storeId, criteria),
      orderBy: { createdAt: 'desc' },
      include: this.includeRelations(),
    });
    return rows.map((row) => this.toDetail(row));
  }

  async findPendingByPatient(
    storeId: string,
    patientId: string,
  ): Promise<FitInDetail[]> {
    const rows = await this.prisma.fitIn.findMany({
      where: { storeId, patientId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: this.includeRelations(),
    });
    return rows.map((row) => this.toDetail(row));
  }

  async save(fitIn: FitIn): Promise<FitInDetail> {
    const row = await this.prisma.fitIn.upsert({
      where: { id: fitIn.id },
      create: {
        id: fitIn.id,
        storeId: fitIn.storeId,
        patientId: fitIn.patientId,
        professionalId: fitIn.professionalId,
        categoryId: fitIn.categoryId,
        fitInDate: fitIn.fitInDate,
        anyDate: fitIn.anyDate,
        shifts: fitIn.shifts,
        planName: fitIn.planName,
        observation: fitIn.observation,
        isUrgent: fitIn.isUrgent,
        status: fitIn.status,
        createdAt: fitIn.createdAt,
        updatedAt: fitIn.updatedAt,
      },
      update: {
        professionalId: fitIn.professionalId,
        categoryId: fitIn.categoryId,
        fitInDate: fitIn.fitInDate,
        anyDate: fitIn.anyDate,
        shifts: fitIn.shifts,
        planName: fitIn.planName,
        observation: fitIn.observation,
        isUrgent: fitIn.isUrgent,
        status: fitIn.status,
        updatedAt: fitIn.updatedAt,
      },
      include: this.includeRelations(),
    });
    return this.toDetail(row);
  }

  async updateStatus(
    storeId: string,
    id: string,
    status: DomainFitInStatus,
  ): Promise<void> {
    await this.prisma.fitIn.updateMany({
      where: { id, storeId },
      data: { status: status, updatedAt: new Date() },
    });
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.fitIn.deleteMany({ where: { id, storeId } });
  }

  private buildWhere(storeId: string, criteria: FitInListCriteria) {
    return {
      storeId,
      ...(criteria.status ? { status: criteria.status } : {}),
      ...(criteria.startDate
        ? {
            OR: [
              { anyDate: true },
              {
                fitInDate: {
                  gte: new Date(`${criteria.startDate}T00:00:00.000Z`),
                },
              },
            ],
          }
        : {}),
      ...(criteria.endDate
        ? {
            OR: [
              { anyDate: true },
              {
                fitInDate: {
                  lte: new Date(`${criteria.endDate}T23:59:59.999Z`),
                },
              },
            ],
          }
        : {}),
    };
  }

  private includeRelations() {
    return {
      patient: { select: { name: true, phone: true } },
      category: { select: { id: true, name: true, color: true } },
      appointment: { select: { id: true } },
    };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string | null;
    categoryId: string | null;
    fitInDate: Date | null;
    anyDate: boolean;
    shifts: FitInShift[];
    planName: string | null;
    observation: string | null;
    isUrgent: boolean;
    status: FitInStatus;
    createdAt: Date;
    updatedAt: Date;
  }): FitIn {
    const props: FitInProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      professionalId: row.professionalId,
      categoryId: row.categoryId,
      fitInDate: row.fitInDate,
      anyDate: row.anyDate,
      shifts: row.shifts,
      planName: row.planName,
      observation: row.observation,
      isUrgent: row.isUrgent,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FitIn.with(props, row.id);
  }

  private toDetail(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string | null;
    categoryId: string | null;
    fitInDate: Date | null;
    anyDate: boolean;
    shifts: FitInShift[];
    planName: string | null;
    observation: string | null;
    isUrgent: boolean;
    status: FitInStatus;
    createdAt: Date;
    updatedAt: Date;
    patient: { name: string; phone: string | null };
    category: { id: string; name: string; color: string } | null;
    appointment: { id: string } | null;
  }): FitInDetail {
    return {
      fitIn: this.toEntity(row),
      patientName: row.patient.name,
      patientPhone: row.patient.phone,
      category: row.category
        ? {
            id: row.category.id,
            name: row.category.name,
            color: row.category.color,
          }
        : null,
      appointmentId: row.appointment?.id ?? null,
    };
  }
}
