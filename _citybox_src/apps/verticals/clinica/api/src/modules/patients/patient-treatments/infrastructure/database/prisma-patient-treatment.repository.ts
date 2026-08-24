import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PatientTreatmentRepository } from '../../domain/repositories/patient-treatment.repository.interface';
import {
  PatientTreatment,
  type PatientTreatmentLocationType,
  type PatientTreatmentProps,
  type PatientTreatmentSource,
  type PatientTreatmentStatus,
} from '../../domain/entities/patient-treatment.entity';

type PatientTreatmentRow = {
  id: string;
  storeId: string;
  patientId: string;
  source: PatientTreatmentSource;
  status: PatientTreatmentStatus;
  budgetId: string | null;
  budgetItemId: string | null;
  planId: string | null;
  treatmentId: string | null;
  professionalId: string | null;
  professionalName: string;
  planName: string;
  treatmentName: string;
  description: string;
  valueCents: number;
  locationType: PatientTreatmentLocationType;
  locationLabel: string;
  sessionIndex: number | null;
  sessionTotal: number | null;
  diagnosis: string;
  observation: string;
  sortOrder: number;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientTreatmentRepository extends PatientTreatmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<PatientTreatment | null> {
    const row = await this.prisma.patientTreatment.findFirst({
      where: { id, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientTreatment[]> {
    const rows = await this.prisma.patientTreatment.findMany({
      where: { storeId, patientId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async getMaxSortOrder(storeId: string, patientId: string): Promise<number> {
    const row = await this.prisma.patientTreatment.findFirst({
      where: { storeId, patientId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return row?.sortOrder ?? -1;
  }

  async save(treatment: PatientTreatment): Promise<PatientTreatment> {
    const row = await this.prisma.patientTreatment.upsert({
      where: { id: treatment.id },
      create: this.toCreateData(treatment),
      update: this.toUpdateData(treatment),
    });
    return this.toEntity(row);
  }

  async saveMany(treatments: PatientTreatment[]): Promise<PatientTreatment[]> {
    const saved: PatientTreatment[] = [];
    for (const treatment of treatments) {
      saved.push(await this.save(treatment));
    }
    return saved;
  }

  async delete(storeId: string, patientId: string, id: string): Promise<void> {
    await this.prisma.patientTreatment.deleteMany({
      where: { id, storeId, patientId },
    });
  }

  async listStandaloneActiveInRange(
    storeId: string,
    criteria: {
      startIsoDate: string;
      endIsoDate: string;
    },
  ): Promise<
    Array<{ treatment: PatientTreatment; patientName: string }>
  > {
    const start = new Date(`${criteria.startIsoDate}T00:00:00.000Z`);
    const end = new Date(`${criteria.endIsoDate}T23:59:59.999Z`);

    const rows = await this.prisma.patientTreatment.findMany({
      where: {
        storeId,
        status: 'active',
        source: 'standalone',
        createdAt: { gte: start, lte: end },
      },
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      treatment: this.toEntity(row),
      patientName: row.patient.name,
    }));
  }

  private toCreateData(treatment: PatientTreatment) {
    return {
      id: treatment.id,
      storeId: treatment.storeId,
      patientId: treatment.patientId,
      source: treatment.source,
      status: treatment.status,
      budgetId: treatment.budgetId,
      budgetItemId: treatment.budgetItemId,
      planId: treatment.planId,
      treatmentId: treatment.treatmentId,
      professionalId: treatment.professionalId,
      professionalName: treatment.professionalName,
      planName: treatment.planName,
      treatmentName: treatment.treatmentName,
      description: treatment.description,
      valueCents: treatment.valueCents,
      locationType: treatment.locationType,
      locationLabel: treatment.locationLabel,
      sessionIndex: treatment.sessionIndex,
      sessionTotal: treatment.sessionTotal,
      diagnosis: treatment.diagnosis,
      observation: treatment.observation,
      sortOrder: treatment.sortOrder,
      finalizedAt: treatment.finalizedAt,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt,
    };
  }

  private toUpdateData(treatment: PatientTreatment) {
    return {
      status: treatment.status,
      professionalId: treatment.professionalId,
      professionalName: treatment.professionalName,
      description: treatment.description,
      valueCents: treatment.valueCents,
      locationType: treatment.locationType,
      locationLabel: treatment.locationLabel,
      sessionIndex: treatment.sessionIndex,
      sessionTotal: treatment.sessionTotal,
      diagnosis: treatment.diagnosis,
      observation: treatment.observation,
      sortOrder: treatment.sortOrder,
      finalizedAt: treatment.finalizedAt,
      updatedAt: treatment.updatedAt,
    };
  }

  private toEntity(row: PatientTreatmentRow): PatientTreatment {
    const props: PatientTreatmentProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      source: row.source,
      status: row.status,
      budgetId: row.budgetId,
      budgetItemId: row.budgetItemId,
      planId: row.planId,
      treatmentId: row.treatmentId,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      planName: row.planName,
      treatmentName: row.treatmentName,
      description: row.description,
      valueCents: row.valueCents,
      locationType: row.locationType,
      locationLabel: row.locationLabel,
      sessionIndex: row.sessionIndex,
      sessionTotal: row.sessionTotal,
      diagnosis: row.diagnosis,
      observation: row.observation,
      sortOrder: row.sortOrder,
      finalizedAt: row.finalizedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PatientTreatment.with(props, row.id);
  }
}
