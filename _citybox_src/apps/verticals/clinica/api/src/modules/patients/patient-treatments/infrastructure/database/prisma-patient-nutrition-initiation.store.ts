import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type {
  PatientNutritionInitiationResult,
  PatientNutritionInitiationSummary,
} from '../../domain/types/patient-nutrition-initiation';
import { filledNutritionSections } from '../../application/lib/nutrition-init-sections';
import {
  PatientNutritionInitiationStore,
  type SavePatientNutritionInitiationInput,
} from '../../application/ports/patient-nutrition-initiation.store';

type NutritionInitRow = {
  id: string;
  storeId: string;
  patientId: string;
  treatmentId: string;
  evolutionId: string;
  patientAnamnesisId: string | null;
  anamnesis: Prisma.JsonValue;
  body: Prisma.JsonValue;
  treatmentPlan: Prisma.JsonValue;
  professionalId: string | null;
  professionalName: string;
  initiatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function asSection(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toResult(row: NutritionInitRow): PatientNutritionInitiationResult {
  return {
    id: row.id,
    storeId: row.storeId,
    patientId: row.patientId,
    treatmentId: row.treatmentId,
    evolutionId: row.evolutionId,
    patientAnamnesisId: row.patientAnamnesisId,
    anamnesis: asSection(row.anamnesis),
    body: asSection(row.body),
    treatmentPlan: asSection(row.treatmentPlan),
    professionalId: row.professionalId,
    professionalName: row.professionalName,
    initiatedAt: row.initiatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaPatientNutritionInitiationStore extends PatientNutritionInitiationStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(
    input: SavePatientNutritionInitiationInput,
  ): Promise<PatientNutritionInitiationResult> {
    const { initiation, evolution, history, patientAnamnesis } = input;

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.treatmentEvolution.create({
        data: {
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
            evolution.cid10Codes === null
              ? Prisma.DbNull
              : evolution.cid10Codes,
          confirmedAt: evolution.confirmedAt,
          confirmedBy: evolution.confirmedBy,
          confirmationHash: evolution.confirmationHash,
          createdAt: evolution.createdAt,
          updatedAt: evolution.updatedAt,
        },
      });

      await tx.evolutionHistory.create({
        data: {
          id: history.id,
          storeId: history.storeId,
          evolutionId: history.evolutionId,
          action: history.action,
          professionalId: history.professionalId,
          professionalName: history.professionalName,
          occurredAt: history.occurredAt,
          createdAt: history.createdAt,
        },
      });

      if (patientAnamnesis) {
        await tx.patientAnamnesis.create({
          data: {
            id: patientAnamnesis.id,
            storeId: patientAnamnesis.storeId,
            patientId: patientAnamnesis.patientId,
            templateId: patientAnamnesis.templateId,
            templateName: patientAnamnesis.templateName,
            issuedAt: patientAnamnesis.issuedAt,
            status: patientAnamnesis.status,
            signatureStatus: patientAnamnesis.signatureStatus,
            fillingMode: patientAnamnesis.fillingMode,
            consultationReason: patientAnamnesis.consultationReason,
            questionsSnapshot:
              patientAnamnesis.questionsSnapshot as Prisma.InputJsonValue,
            answers:
              patientAnamnesis.answers === null
                ? Prisma.DbNull
                : (patientAnamnesis.answers as Prisma.InputJsonValue),
            publicToken: patientAnamnesis.publicToken,
            linkExpiresAt: patientAnamnesis.linkExpiresAt,
            createdAt: patientAnamnesis.createdAt,
            updatedAt: patientAnamnesis.updatedAt,
          },
        });
      }

      return tx.patientNutritionInitiation.create({
        data: {
          id: initiation.id,
          storeId: initiation.storeId,
          patientId: initiation.patientId,
          treatmentId: initiation.treatmentId,
          evolutionId: initiation.evolutionId,
          patientAnamnesisId: patientAnamnesis?.id ?? null,
          anamnesis: initiation.anamnesis as Prisma.InputJsonValue,
          body: initiation.body as Prisma.InputJsonValue,
          treatmentPlan: initiation.treatmentPlan as Prisma.InputJsonValue,
          professionalId: initiation.professionalId,
          professionalName: initiation.professionalName,
          initiatedAt: initiation.initiatedAt,
          createdAt: initiation.createdAt,
          updatedAt: initiation.updatedAt,
        },
      });
    });

    return toResult(row);
  }

  async findByEvolutionId(
    storeId: string,
    patientId: string,
    evolutionId: string,
  ): Promise<PatientNutritionInitiationResult | null> {
    const row = await this.prisma.patientNutritionInitiation.findFirst({
      where: { storeId, patientId, evolutionId },
    });
    return row ? toResult(row) : null;
  }

  async findSummariesByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientNutritionInitiationSummary[]> {
    const rows = await this.prisma.patientNutritionInitiation.findMany({
      where: { storeId, patientId },
      orderBy: { initiatedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patientId,
      treatmentId: row.treatmentId,
      evolutionId: row.evolutionId,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      initiatedAt: row.initiatedAt,
      filledSections: filledNutritionSections({
        anamnesis: asSection(row.anamnesis),
        body: asSection(row.body),
        treatmentPlan: asSection(row.treatmentPlan),
      }),
    }));
  }
}
