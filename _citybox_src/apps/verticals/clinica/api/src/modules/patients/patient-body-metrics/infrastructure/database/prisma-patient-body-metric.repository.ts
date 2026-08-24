import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientBodyMetric,
  type PatientBodyMetricProps,
} from '../../domain/entities/patient-body-metric.entity';
import {
  PatientBodyMetricRepository,
  type PatientBodyMetricListCriteria,
  type PatientBodyMetricListSortBy,
} from '../../domain/repositories/patient-body-metric.repository.interface';

type PatientBodyMetricRow = {
  id: string;
  storeId: string;
  patientId: string;
  measuredAt: Date;
  weightKg: number;
  heightCm: number;
  bmi: number;
  professionalId: string;
  professionalName: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientBodyMetricRepository extends PatientBodyMetricRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientBodyMetricListCriteria,
  ): Promise<PatientBodyMetric[]> {
    const rows = await this.prisma.patientBodyMetric.findMany({
      where: { storeId, patientId },
      orderBy: this.buildOrderBy(criteria.sortBy, criteria.sortOrder),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    _criteria: Omit<PatientBodyMetricListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.patientBodyMetric.count({
      where: { storeId, patientId },
    });
  }

  async save(metric: PatientBodyMetric): Promise<PatientBodyMetric> {
    const data = this.toPersistence(metric);
    const row = await this.prisma.patientBodyMetric.create({ data });
    return this.toEntity(row);
  }

  private buildOrderBy(
    sortBy: PatientBodyMetricListSortBy | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ) {
    const order = sortOrder ?? 'desc';
    if (sortBy === 'measuredAt' || sortBy == null) {
      return { measuredAt: order };
    }
    return { measuredAt: order };
  }

  private toEntity(row: PatientBodyMetricRow): PatientBodyMetric {
    return PatientBodyMetric.create(this.toProps(row), row.id);
  }

  private toProps(row: PatientBodyMetricRow): PatientBodyMetricProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      measuredAt: row.measuredAt,
      weightKg: row.weightKg,
      heightCm: row.heightCm,
      bmi: row.bmi,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPersistence(metric: PatientBodyMetric) {
    return {
      id: metric.id,
      storeId: metric.storeId,
      patientId: metric.patientId,
      measuredAt: metric.measuredAt,
      weightKg: metric.weightKg,
      heightCm: metric.heightCm,
      bmi: metric.bmi,
      professionalId: metric.professionalId,
      professionalName: metric.professionalName,
      notes: metric.notes,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    };
  }
}
