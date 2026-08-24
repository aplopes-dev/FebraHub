import { Injectable } from '@nestjs/common';
import {
  ContractSignatureStatus,
  PatientContractIssuedVia,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientContractEmission,
  type PatientContractFormValues,
  type PatientContractEmissionProps,
} from '../../domain/entities/patient-contract-emission.entity';
import { PatientContractEmissionRepository } from '../../domain/repositories/patient-contract-emission.repository.interface';
import type { PatientContractEmissionListCriteria } from '../../domain/repositories/patient-contract-emission.repository.interface';
import {
  buildPatientContractEmissionListOrderBy,
  buildPatientContractEmissionListWhere,
} from './patient-contract-emission-list.where';

type PatientContractEmissionRow = {
  id: string;
  storeId: string;
  patientId: string;
  budgetId: string | null;
  templateId: string;
  templateName: string;
  content: string;
  issuedAt: Date;
  issuedVia: PatientContractIssuedVia;
  responsibleName: string;
  patientName: string;
  responsibleSignatureStatus: ContractSignatureStatus;
  patientSignatureStatus: ContractSignatureStatus;
  formValues: unknown;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientContractEmissionRepository extends PatientContractEmissionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    contractId: string,
  ): Promise<PatientContractEmission | null> {
    const row = await this.prisma.patientContractEmission.findFirst({
      where: { id: contractId, storeId, patientId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<PatientContractEmission | null> {
    const row = await this.prisma.patientContractEmission.findFirst({
      where: { storeId, budgetId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientContractEmissionListCriteria,
  ): Promise<PatientContractEmission[]> {
    const rows = await this.prisma.patientContractEmission.findMany({
      where: buildPatientContractEmissionListWhere(
        storeId,
        patientId,
        criteria,
      ),
      orderBy: buildPatientContractEmissionListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientContractEmissionListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.patientContractEmission.count({
      where: buildPatientContractEmissionListWhere(
        storeId,
        patientId,
        criteria,
      ),
    });
  }

  async save(
    emission: PatientContractEmission,
  ): Promise<PatientContractEmission> {
    const data = this.toPersistence(emission);
    const row = await this.prisma.patientContractEmission.upsert({
      where: { id: emission.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    patientId: string,
    contractId: string,
  ): Promise<void> {
    await this.prisma.patientContractEmission.deleteMany({
      where: { id: contractId, storeId, patientId },
    });
  }

  private toEntity(row: PatientContractEmissionRow): PatientContractEmission {
    return PatientContractEmission.create(this.toProps(row), row.id);
  }

  private toProps(
    row: PatientContractEmissionRow,
  ): PatientContractEmissionProps {
    return {
      storeId: row.storeId,
      patientId: row.patientId,
      budgetId: row.budgetId,
      templateId: row.templateId,
      templateName: row.templateName,
      content: row.content,
      issuedAt: row.issuedAt,
      issuedVia: row.issuedVia,
      responsibleName: row.responsibleName,
      patientName: row.patientName,
      responsibleSignatureStatus: row.responsibleSignatureStatus,
      patientSignatureStatus: row.patientSignatureStatus,
      formValues: row.formValues as PatientContractFormValues,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPersistence(emission: PatientContractEmission) {
    return {
      id: emission.id,
      storeId: emission.storeId,
      patientId: emission.patientId,
      budgetId: emission.budgetId,
      templateId: emission.templateId,
      templateName: emission.templateName,
      content: emission.content,
      issuedAt: emission.issuedAt,
      issuedVia: emission.issuedVia,
      responsibleName: emission.responsibleName,
      patientName: emission.patientName,
      responsibleSignatureStatus: emission.responsibleSignatureStatus,
      patientSignatureStatus: emission.patientSignatureStatus,
      formValues: emission.formValues,
      createdAt: emission.createdAt,
      updatedAt: emission.updatedAt,
    };
  }
}
