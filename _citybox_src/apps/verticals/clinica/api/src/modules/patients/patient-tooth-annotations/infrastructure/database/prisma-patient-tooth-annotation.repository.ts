import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientToothAnnotation,
  type PatientToothAnnotationProps,
} from '../../domain/entities/patient-tooth-annotation.entity';
import {
  PatientToothAnnotationRepository,
  type PatientToothAnnotationListCriteria,
} from '../../domain/repositories/patient-tooth-annotation.repository.interface';

type PatientToothAnnotationRow = {
  id: string;
  storeId: string;
  patientId: string;
  toothNumber: number;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: Date;
};

@Injectable()
export class PrismaPatientToothAnnotationRepository extends PatientToothAnnotationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientToothAnnotation | null> {
    const row = await this.prisma.patientToothAnnotation.findFirst({
      where: { id: annotationId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientToothAnnotationListCriteria = {},
  ): Promise<PatientToothAnnotation[]> {
    const rows = await this.prisma.patientToothAnnotation.findMany({
      where: {
        storeId,
        patientId,
        ...(criteria.toothNumber != null
          ? { toothNumber: criteria.toothNumber }
          : {}),
      },
      orderBy: [{ toothNumber: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => this.toEntity(row));
  }

  async save(
    annotation: PatientToothAnnotation,
  ): Promise<PatientToothAnnotation> {
    const data = this.toPersistence(annotation);
    const row = await this.prisma.patientToothAnnotation.upsert({
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
    await this.prisma.patientToothAnnotation.deleteMany({
      where: { id: annotationId, storeId, patientId },
    });
  }

  private toEntity(row: PatientToothAnnotationRow): PatientToothAnnotation {
    return PatientToothAnnotation.create(this.toProps(row), row.id);
  }

  private toProps(row: PatientToothAnnotationRow): PatientToothAnnotationProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      toothNumber: row.toothNumber,
      content: row.content,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      createdAt: row.createdAt,
    };
  }

  private toPersistence(annotation: PatientToothAnnotation) {
    return {
      id: annotation.id,
      storeId: annotation.storeId,
      patientId: annotation.patientId,
      toothNumber: annotation.toothNumber,
      content: annotation.content,
      professionalId: annotation.professionalId,
      professionalName: annotation.professionalName,
      createdAt: annotation.createdAt,
    };
  }
}
