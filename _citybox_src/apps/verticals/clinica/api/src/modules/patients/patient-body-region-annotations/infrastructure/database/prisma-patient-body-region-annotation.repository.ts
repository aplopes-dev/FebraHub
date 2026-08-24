import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientBodyRegionAnnotation,
  type PatientBodyRegionAnnotationProps,
} from '../../domain/entities/patient-body-region-annotation.entity';
import {
  PatientBodyRegionAnnotationRepository,
  type PatientBodyRegionAnnotationListCriteria,
} from '../../domain/repositories/patient-body-region-annotation.repository.interface';

type PatientBodyRegionAnnotationRow = {
  id: string;
  storeId: string;
  patientId: string;
  bodyRegionId: string;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: Date;
};

@Injectable()
export class PrismaPatientBodyRegionAnnotationRepository extends PatientBodyRegionAnnotationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientBodyRegionAnnotation | null> {
    const row = await this.prisma.patientBodyRegionAnnotation.findFirst({
      where: { id: annotationId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientBodyRegionAnnotationListCriteria = {},
  ): Promise<PatientBodyRegionAnnotation[]> {
    const rows = await this.prisma.patientBodyRegionAnnotation.findMany({
      where: {
        storeId,
        patientId,
        ...(criteria.bodyRegionId != null
          ? { bodyRegionId: criteria.bodyRegionId }
          : {}),
      },
      orderBy: [{ bodyRegionId: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => this.toEntity(row));
  }

  async save(
    annotation: PatientBodyRegionAnnotation,
  ): Promise<PatientBodyRegionAnnotation> {
    const data = this.toPersistence(annotation);
    const row = await this.prisma.patientBodyRegionAnnotation.upsert({
      where: { id: annotation.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<void> {
    await this.prisma.patientBodyRegionAnnotation.deleteMany({
      where: { id: annotationId, storeId, patientId },
    });
  }

  private toEntity(
    row: PatientBodyRegionAnnotationRow,
  ): PatientBodyRegionAnnotation {
    return PatientBodyRegionAnnotation.create(this.toProps(row), row.id);
  }

  private toProps(
    row: PatientBodyRegionAnnotationRow,
  ): PatientBodyRegionAnnotationProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      bodyRegionId: row.bodyRegionId,
      content: row.content,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      createdAt: row.createdAt,
    };
  }

  private toPersistence(annotation: PatientBodyRegionAnnotation) {
    return {
      id: annotation.id,
      storeId: annotation.storeId,
      patientId: annotation.patientId,
      bodyRegionId: annotation.bodyRegionId,
      content: annotation.content,
      professionalId: annotation.professionalId,
      professionalName: annotation.professionalName,
      createdAt: annotation.createdAt,
    };
  }
}
