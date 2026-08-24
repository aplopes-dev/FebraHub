import { Injectable } from '@nestjs/common';
import { PatientCertificateType } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientCertificate,
  type PatientCertificateProps,
} from '../../domain/entities/patient-certificate.entity';
import { PatientCertificateRepository } from '../../domain/repositories/patient-certificate.repository.interface';
import type { PatientCertificateListCriteria } from '../../domain/repositories/patient-certificate.repository.interface';
import type { ProfessionalCouncilType } from '../../../../members/domain/professional-council';
import {
  buildPatientCertificateListOrderBy,
  buildPatientCertificateListWhere,
} from './patient-certificate-list.where';

type PatientCertificateRow = {
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
  type: PatientCertificateType;
  issuedDate: Date;
  issuedAt: Date;
  daysCount: string | null;
  startTime: string | null;
  endTime: string | null;
  cid: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientCertificateRepository extends PatientCertificateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<PatientCertificate | null> {
    const row = await this.prisma.patientCertificate.findFirst({
      where: { id: certificateId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientCertificateListCriteria,
  ): Promise<PatientCertificate[]> {
    const rows = await this.prisma.patientCertificate.findMany({
      where: buildPatientCertificateListWhere(storeId, patientId, criteria),
      orderBy: buildPatientCertificateListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientCertificateListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.patientCertificate.count({
      where: buildPatientCertificateListWhere(storeId, patientId, criteria),
    });
  }

  async save(certificate: PatientCertificate): Promise<PatientCertificate> {
    const data = this.toPersistence(certificate);
    const row = await this.prisma.patientCertificate.upsert({
      where: { id: certificate.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    patientId: string,
    certificateId: string,
  ): Promise<void> {
    await this.prisma.patientCertificate.deleteMany({
      where: { id: certificateId, storeId, patientId },
    });
  }

  private toEntity(row: PatientCertificateRow): PatientCertificate {
    return PatientCertificate.create(this.toProps(row), row.id);
  }

  private toProps(row: PatientCertificateRow): PatientCertificateProps {
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
      type: row.type,
      issuedDate: row.issuedDate,
      issuedAt: row.issuedAt,
      daysCount: row.daysCount,
      startTime: row.startTime,
      endTime: row.endTime,
      cid: row.cid,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPersistence(certificate: PatientCertificate) {
    return {
      id: certificate.id,
      storeId: certificate.storeId,
      patientId: certificate.patientId,
      professionalId: certificate.professionalId,
      professionalName: certificate.professionalName,
      councilType: certificate.councilType,
      councilNumber: certificate.councilNumber,
      councilUf: certificate.councilUf,
      patientName: certificate.patientName,
      clinicName: certificate.clinicName,
      type: certificate.type,
      issuedDate: certificate.issuedDate,
      issuedAt: certificate.issuedAt,
      daysCount: certificate.daysCount,
      startTime: certificate.startTime,
      endTime: certificate.endTime,
      cid: certificate.cid,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }
}
