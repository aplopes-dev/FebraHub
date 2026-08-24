import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientTreatmentFinalizationStore,
  type PatientTreatmentFinalizationInput,
} from '../../application/ports/patient-treatment-finalization.store';
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
export class PrismaPatientTreatmentFinalizationStore extends PatientTreatmentFinalizationStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: PatientTreatmentFinalizationInput,
  ): Promise<PatientTreatment[]> {
    const { treatments, evolution, history } = input;
    if (treatments.length === 0) {
      return [];
    }

    const rows = await this.prisma.$transaction(async (tx) => {
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

      const updated: PatientTreatmentRow[] = [];
      for (const treatment of treatments) {
        const row = await tx.patientTreatment.update({
          where: { id: treatment.id },
          data: {
            status: treatment.status,
            finalizedAt: treatment.finalizedAt,
            updatedAt: treatment.updatedAt,
          },
        });
        updated.push(row);
      }
      return updated;
    });

    return rows.map((row) => this.toEntity(row));
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
