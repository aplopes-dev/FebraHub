import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { TreatmentEvolutionRepository } from '../../domain/repositories/treatment-evolution.repository.interface';
import {
  TreatmentEvolution,
  type EvolutionSignatureStatus,
  type TreatmentEvolutionProps,
  type TreatmentEvolutionSource,
} from '../../domain/entities/treatment-evolution.entity';
import {
  EvolutionHistory,
  type EvolutionHistoryAction,
  type EvolutionHistoryProps,
} from '../../domain/entities/evolution-history.entity';

type TreatmentEvolutionRow = {
  id: string;
  storeId: string;
  patientId: string;
  treatmentId: string | null;
  source: TreatmentEvolutionSource;
  description: string;
  valueCents: number | null;
  evolutionNotes: string;
  professionalId: string | null;
  professionalName: string;
  finalizedAt: Date;
  soapSubjective: string | null;
  soapObjective: string | null;
  soapAssessment: string | null;
  soapPlan: string | null;
  cid10Codes: Prisma.JsonValue | null;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  confirmationHash: string | null;
  signatureStatus: EvolutionSignatureStatus;
  signatureRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EvolutionHistoryRow = {
  id: string;
  storeId: string;
  evolutionId: string;
  action: EvolutionHistoryAction;
  professionalId: string | null;
  professionalName: string;
  occurredAt: Date;
  createdAt: Date;
};

@Injectable()
export class PrismaTreatmentEvolutionRepository extends TreatmentEvolutionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<TreatmentEvolution | null> {
    const row = await this.prisma.treatmentEvolution.findFirst({
      where: { id, storeId, patientId },
    });
    return row ? this.toEvolutionEntity(row) : null;
  }

  async findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<TreatmentEvolution[]> {
    const rows = await this.prisma.treatmentEvolution.findMany({
      where: { storeId, patientId },
      orderBy: { finalizedAt: 'desc' },
    });
    return rows.map((row) => this.toEvolutionEntity(row));
  }

  async findByIds(
    storeId: string,
    patientId: string,
    ids: string[],
  ): Promise<TreatmentEvolution[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.treatmentEvolution.findMany({
      where: { storeId, patientId, id: { in: ids } },
    });
    return rows.map((row) => this.toEvolutionEntity(row));
  }

  async save(evolution: TreatmentEvolution): Promise<TreatmentEvolution> {
    const row = await this.prisma.treatmentEvolution.upsert({
      where: { id: evolution.id },
      create: this.toEvolutionCreateData(evolution),
      update: this.toEvolutionUpdateData(evolution),
    });
    return this.toEvolutionEntity(row);
  }

  async delete(storeId: string, patientId: string, id: string): Promise<void> {
    await this.prisma.treatmentEvolution.deleteMany({
      where: { id, storeId, patientId },
    });
  }

  async appendHistory(entry: EvolutionHistory): Promise<EvolutionHistory> {
    const row = await this.prisma.evolutionHistory.create({
      data: {
        id: entry.id,
        storeId: entry.storeId,
        evolutionId: entry.evolutionId,
        action: entry.action,
        professionalId: entry.professionalId,
        professionalName: entry.professionalName,
        occurredAt: entry.occurredAt,
        createdAt: entry.createdAt,
      },
    });
    return this.toHistoryEntity(row);
  }

  async findHistoryByEvolutionId(
    storeId: string,
    evolutionId: string,
  ): Promise<EvolutionHistory[]> {
    const rows = await this.prisma.evolutionHistory.findMany({
      where: { storeId, evolutionId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((row) => this.toHistoryEntity(row));
  }

  private toEvolutionCreateData(evolution: TreatmentEvolution) {
    return {
      id: evolution.id,
      storeId: evolution.storeId,
      patientId: evolution.patientId,
      treatmentId: evolution.treatmentId,
      source: evolution.source,
      description: evolution.description,
      valueCents: evolution.valueCents,
      evolutionNotes: evolution.evolutionNotes,
      professionalId: evolution.professionalId,
      professionalName: evolution.professionalName,
      finalizedAt: evolution.finalizedAt,
      soapSubjective: evolution.soapSubjective,
      soapObjective: evolution.soapObjective,
      soapAssessment: evolution.soapAssessment,
      soapPlan: evolution.soapPlan,
      cid10Codes:
        evolution.cid10Codes === null ? Prisma.DbNull : evolution.cid10Codes,
      confirmedAt: evolution.confirmedAt,
      confirmedBy: evolution.confirmedBy,
      confirmationHash: evolution.confirmationHash,
      signatureStatus: evolution.signatureStatus,
      signatureRequestId: evolution.signatureRequestId,
      createdAt: evolution.createdAt,
      updatedAt: evolution.updatedAt,
    };
  }

  private toEvolutionUpdateData(evolution: TreatmentEvolution) {
    return {
      description: evolution.description,
      valueCents: evolution.valueCents,
      evolutionNotes: evolution.evolutionNotes,
      professionalId: evolution.professionalId,
      professionalName: evolution.professionalName,
      finalizedAt: evolution.finalizedAt,
      soapSubjective: evolution.soapSubjective,
      soapObjective: evolution.soapObjective,
      soapAssessment: evolution.soapAssessment,
      soapPlan: evolution.soapPlan,
      cid10Codes:
        evolution.cid10Codes === null ? Prisma.DbNull : evolution.cid10Codes,
      confirmedAt: evolution.confirmedAt,
      confirmedBy: evolution.confirmedBy,
      confirmationHash: evolution.confirmationHash,
      signatureStatus: evolution.signatureStatus,
      signatureRequestId: evolution.signatureRequestId,
      updatedAt: evolution.updatedAt,
    };
  }

  private toEvolutionEntity(row: TreatmentEvolutionRow): TreatmentEvolution {
    const props: TreatmentEvolutionProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      treatmentId: row.treatmentId,
      source: row.source,
      description: row.description,
      valueCents: row.valueCents,
      evolutionNotes: row.evolutionNotes,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      finalizedAt: row.finalizedAt,
      soapSubjective: row.soapSubjective,
      soapObjective: row.soapObjective,
      soapAssessment: row.soapAssessment,
      soapPlan: row.soapPlan,
      cid10Codes: this.parseCid10Codes(row.cid10Codes),
      confirmedAt: row.confirmedAt,
      confirmedBy: row.confirmedBy,
      confirmationHash: row.confirmationHash,
      signatureStatus: row.signatureStatus,
      signatureRequestId: row.signatureRequestId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return TreatmentEvolution.with(props, row.id);
  }

  private toHistoryEntity(row: EvolutionHistoryRow): EvolutionHistory {
    const props: EvolutionHistoryProps = {
      storeId: row.storeId,
      evolutionId: row.evolutionId,
      action: row.action,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      occurredAt: row.occurredAt,
      createdAt: row.createdAt,
    };
    return EvolutionHistory.with(props, row.id);
  }

  private parseCid10Codes(value: Prisma.JsonValue | null): string[] | null {
    if (value === null) return null;
    if (!Array.isArray(value)) return null;
    return value.filter((item): item is string => typeof item === 'string');
  }
}
