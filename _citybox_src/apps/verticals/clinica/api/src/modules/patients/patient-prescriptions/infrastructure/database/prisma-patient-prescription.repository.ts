import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientPrescription,
  type PatientPrescriptionProps,
  type PrescriptionItem,
} from '../../domain/entities/patient-prescription.entity';
import { PatientPrescriptionRepository } from '../../domain/repositories/patient-prescription.repository.interface';
import type { PatientPrescriptionListCriteria } from '../../domain/repositories/patient-prescription.repository.interface';
import type { ProfessionalCouncilType } from '../../../../members/domain/professional-council';
import {
  buildPatientPrescriptionListOrderBy,
  buildPatientPrescriptionListWhere,
} from './patient-prescription-list.where';

type PatientPrescriptionRow = {
  id: string;
  storeId: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  councilType: ProfessionalCouncilType | null;
  councilNumber: string | null;
  councilUf: string | null;
  patientName: string;
  clinicName: string | null;
  issuedDate: Date;
  issuedAt: Date;
  items: unknown;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientPrescriptionRepository extends PatientPrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    prescriptionId: string,
  ): Promise<PatientPrescription | null> {
    const row = await this.prisma.patientPrescription.findFirst({
      where: { id: prescriptionId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientPrescriptionListCriteria,
  ): Promise<PatientPrescription[]> {
    const rows = await this.prisma.patientPrescription.findMany({
      where: buildPatientPrescriptionListWhere(storeId, patientId, criteria),
      orderBy: buildPatientPrescriptionListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientPrescriptionListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.patientPrescription.count({
      where: buildPatientPrescriptionListWhere(storeId, patientId, criteria),
    });
  }

  async save(prescription: PatientPrescription): Promise<PatientPrescription> {
    const data = this.toPersistence(prescription);
    const row = await this.prisma.patientPrescription.upsert({
      where: { id: prescription.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    patientId: string,
    prescriptionId: string,
  ): Promise<void> {
    await this.prisma.patientPrescription.deleteMany({
      where: { id: prescriptionId, storeId, patientId },
    });
  }

  private toEntity(row: PatientPrescriptionRow): PatientPrescription {
    return PatientPrescription.create(this.toProps(row), row.id);
  }

  private toProps(row: PatientPrescriptionRow): PatientPrescriptionProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      councilType: row.councilType,
      councilNumber: row.councilNumber,
      councilUf: row.councilUf,
      patientName: row.patientName,
      clinicName: row.clinicName,
      issuedDate: row.issuedDate,
      issuedAt: row.issuedAt,
      items: row.items as PrescriptionItem[],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPersistence(prescription: PatientPrescription) {
    return {
      id: prescription.id,
      storeId: prescription.storeId,
      patientId: prescription.patientId,
      professionalId: prescription.professionalId,
      professionalName: prescription.professionalName,
      councilType: prescription.councilType,
      councilNumber: prescription.councilNumber,
      councilUf: prescription.councilUf,
      patientName: prescription.patientName,
      clinicName: prescription.clinicName,
      issuedDate: prescription.issuedDate,
      issuedAt: prescription.issuedAt,
      items: prescription.items,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
    };
  }
}
