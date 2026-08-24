import { Injectable } from '@nestjs/common';
import type { ReturnAlertSource as PrismaReturnAlertSource } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  toDomainReturnAlertSource,
  toPrismaReturnAlertSource,
} from './return-alert-prisma.utils';
import {
  ReturnAlert,
  type ReturnAlertProps,
} from '../../domain/entities/return-alert.entity';
import {
  ReturnAlertRepository,
  type ReturnAlertDetail,
  type ReturnAlertListCriteria,
} from '../../domain/repositories/return-alert.repository.interface';

@Injectable()
export class PrismaReturnAlertRepository extends ReturnAlertRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ReturnAlertDetail | null> {
    const row = await this.prisma.returnAlert.findFirst({
      where: { id, storeId },
      include: { patient: { select: { name: true, phone: true } } },
    });
    return row ? this.toDetail(row) : null;
  }

  async findByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<ReturnAlert | null> {
    const row = await this.prisma.returnAlert.findFirst({
      where: { storeId, appointmentId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: ReturnAlertListCriteria,
  ): Promise<ReturnAlertDetail[]> {
    const rows = await this.prisma.returnAlert.findMany({
      where: this.buildWhere(storeId, criteria),
      orderBy: { dueDate: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
      include: { patient: { select: { name: true, phone: true } } },
    });
    return rows.map((row) => this.toDetail(row));
  }

  async count(
    storeId: string,
    criteria: Omit<ReturnAlertListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.returnAlert.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async save(alert: ReturnAlert): Promise<ReturnAlertDetail> {
    const row = await this.prisma.returnAlert.upsert({
      where: { id: alert.id },
      create: {
        id: alert.id,
        storeId: alert.storeId,
        patientId: alert.patientId,
        professionalId: alert.professionalId,
        appointmentId: alert.appointmentId,
        dueDate: alert.dueDate,
        reason: alert.reason,
        source: toPrismaReturnAlertSource(alert.source),
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      },
      update: {
        patientId: alert.patientId,
        professionalId: alert.professionalId,
        appointmentId: alert.appointmentId,
        dueDate: alert.dueDate,
        reason: alert.reason,
        source: toPrismaReturnAlertSource(alert.source),
        updatedAt: alert.updatedAt,
      },
      include: { patient: { select: { name: true, phone: true } } },
    });
    return this.toDetail(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.returnAlert.deleteMany({ where: { id, storeId } });
  }

  private buildWhere(
    storeId: string,
    criteria: Omit<ReturnAlertListCriteria, 'skip' | 'take'>,
  ) {
    const dueDate =
      criteria.fromDate || criteria.toDate
        ? {
            ...(criteria.fromDate
              ? { gte: new Date(`${criteria.fromDate}T00:00:00.000Z`) }
              : {}),
            ...(criteria.toDate
              ? { lte: new Date(`${criteria.toDate}T23:59:59.999Z`) }
              : {}),
          }
        : undefined;

    return {
      storeId,
      ...(criteria.patientId ? { patientId: criteria.patientId } : {}),
      ...(dueDate ? { dueDate } : {}),
    };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string;
    appointmentId: string | null;
    dueDate: Date;
    reason: string | null;
    source: PrismaReturnAlertSource;
    createdAt: Date;
    updatedAt: Date;
  }): ReturnAlert {
    const props: ReturnAlertProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      professionalId: row.professionalId,
      appointmentId: row.appointmentId,
      dueDate: row.dueDate,
      reason: row.reason,
      source: toDomainReturnAlertSource(row.source),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ReturnAlert.with(props, row.id);
  }

  private toDetail(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string;
    appointmentId: string | null;
    dueDate: Date;
    reason: string | null;
    source: PrismaReturnAlertSource;
    createdAt: Date;
    updatedAt: Date;
    patient: { name: string; phone: string | null };
  }): ReturnAlertDetail {
    return {
      alert: this.toEntity(row),
      patientName: row.patient.name,
      patientPhone: row.patient.phone,
    };
  }
}
