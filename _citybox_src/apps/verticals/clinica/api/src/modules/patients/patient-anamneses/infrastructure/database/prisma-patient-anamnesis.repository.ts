import { Injectable } from '@nestjs/common';
import {
  PatientAnamnesisFillingMode,
  PatientAnamnesisSignatureStatus,
  PatientAnamnesisStatus,
  Prisma,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientAnamnesis,
  type PatientAnamnesisAnswer,
  type PatientAnamnesisProps,
  type PatientAnamnesisQuestionSnapshot,
} from '../../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../../domain/repositories/patient-anamnesis.repository.interface';
import type {
  PatientAnamnesisListCriteria,
  PatientAnamnesisPublicContext,
} from '../../domain/repositories/patient-anamnesis.repository.interface';
import {
  buildPatientAnamnesisListOrderBy,
  buildPatientAnamnesisListWhere,
} from './patient-anamnesis-list.where';

type PatientAnamnesisRow = {
  id: string;
  storeId: string;
  patientId: string;
  templateId: string;
  templateName: string;
  issuedAt: Date;
  status: PatientAnamnesisStatus;
  signatureStatus: PatientAnamnesisSignatureStatus;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason: string | null;
  questionsSnapshot: unknown;
  answers: unknown;
  publicToken: string | null;
  linkExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientAnamnesisRepository extends PatientAnamnesisRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    anamnesisId: string,
  ): Promise<PatientAnamnesis | null> {
    const row = await this.prisma.patientAnamnesis.findFirst({
      where: { id: anamnesisId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByPublicToken(
    publicToken: string,
  ): Promise<PatientAnamnesisPublicContext | null> {
    const row = await this.prisma.patientAnamnesis.findFirst({
      where: { publicToken },
      include: {
        patient: { select: { name: true } },
      },
    });

    if (!row) {
      return null;
    }

    const clinicDisplayName = await this.resolveClinicDisplayName(row.storeId);

    return {
      anamnesis: this.toEntity(row),
      patientName: row.patient.name,
      clinicDisplayName,
    };
  }

  private async resolveClinicDisplayName(storeId: string): Promise<string> {
    const [profile, clinicStore, clinic] = await Promise.all([
      this.prisma.clinicStoreProfile.findUnique({
        where: { storeId },
        select: { clinicName: true, communicationsName: true },
      }),
      this.prisma.clinicStore.findUnique({
        where: { storeId },
        select: { tradeName: true },
      }),
      this.prisma.clinic.findUnique({
        where: { id: storeId },
        select: { name: true },
      }),
    ]);

    const fromCommunications = profile?.communicationsName?.trim();
    if (fromCommunications) {
      return fromCommunications;
    }

    const fromProfile = profile?.clinicName?.trim();
    if (fromProfile) {
      return fromProfile;
    }

    const fromStore = clinicStore?.tradeName?.trim();
    if (fromStore) {
      return fromStore;
    }

    const fromClinic = clinic?.name?.trim();
    if (fromClinic) {
      return fromClinic;
    }

    return 'Clínica';
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientAnamnesisListCriteria,
  ): Promise<PatientAnamnesis[]> {
    const rows = await this.prisma.patientAnamnesis.findMany({
      where: buildPatientAnamnesisListWhere(storeId, patientId, criteria),
      orderBy: buildPatientAnamnesisListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientAnamnesisListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.patientAnamnesis.count({
      where: buildPatientAnamnesisListWhere(storeId, patientId, criteria),
    });
  }

  async save(anamnesis: PatientAnamnesis): Promise<PatientAnamnesis> {
    const data = this.toPersistence(anamnesis);
    const row = await this.prisma.patientAnamnesis.upsert({
      where: { id: anamnesis.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    patientId: string,
    anamnesisId: string,
  ): Promise<void> {
    await this.prisma.patientAnamnesis.deleteMany({
      where: { id: anamnesisId, storeId, patientId },
    });
  }

  private toEntity(row: PatientAnamnesisRow): PatientAnamnesis {
    return PatientAnamnesis.create(this.toProps(row), row.id);
  }

  private toProps(row: PatientAnamnesisRow): PatientAnamnesisProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      templateId: row.templateId,
      templateName: row.templateName,
      issuedAt: row.issuedAt,
      status: row.status,
      signatureStatus: row.signatureStatus,
      fillingMode: row.fillingMode,
      consultationReason: row.consultationReason,
      questionsSnapshot:
        row.questionsSnapshot as PatientAnamnesisQuestionSnapshot[],
      answers: (row.answers as PatientAnamnesisAnswer[] | null) ?? null,
      publicToken: row.publicToken,
      linkExpiresAt: row.linkExpiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPersistence(anamnesis: PatientAnamnesis) {
    return {
      id: anamnesis.id,
      storeId: anamnesis.storeId,
      patientId: anamnesis.patientId,
      templateId: anamnesis.templateId,
      templateName: anamnesis.templateName,
      issuedAt: anamnesis.issuedAt,
      status: anamnesis.status,
      signatureStatus: anamnesis.signatureStatus,
      fillingMode: anamnesis.fillingMode,
      consultationReason: anamnesis.consultationReason,
      questionsSnapshot: anamnesis.questionsSnapshot,
      answers: anamnesis.answers === null ? Prisma.DbNull : anamnesis.answers,
      publicToken: anamnesis.publicToken,
      linkExpiresAt: anamnesis.linkExpiresAt,
      createdAt: anamnesis.createdAt,
      updatedAt: anamnesis.updatedAt,
    };
  }
}
