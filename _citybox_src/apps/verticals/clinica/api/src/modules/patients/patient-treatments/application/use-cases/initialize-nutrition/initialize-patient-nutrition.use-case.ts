import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolution } from '../../../../treatment-evolutions/domain/entities/treatment-evolution.entity';
import { EvolutionHistory } from '../../../../treatment-evolutions/domain/entities/evolution-history.entity';
import { PatientAnamnesis } from '../../../../patient-anamneses/domain/entities/patient-anamnesis.entity';
import type { PatientAnamnesisAnswer } from '../../../../patient-anamneses/domain/entities/patient-anamnesis.entity';
import { BuildTemplateQuestionsSnapshotService } from '../../../../patient-anamneses/application/services/build-template-questions-snapshot.service';
import { ValidatePatientAnamnesisAnswersService } from '../../../../patient-anamneses/application/services/validate-patient-anamnesis-answers.service';
import { toIssuedAtDate } from '../../../../patient-anamneses/application/utils/patient-anamnesis-dates';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientNutritionInitiationStore } from '../../ports/patient-nutrition-initiation.store';
import type {
  NutritionInitSectionPayload,
  PatientNutritionInitiationResult,
} from '../../../domain/types/patient-nutrition-initiation';

export type InitializePatientNutritionAnamnesisInput = {
  templateId?: string;
  consultationReason?: string;
  answers?: PatientAnamnesisAnswer[];
};

export type InitializePatientNutritionDto = {
  storeId: string;
  patientId: string;
  treatmentId: string;
  professionalId: string;
  professionalName?: string;
  initiatedAt: Date;
  anamnesis?: InitializePatientNutritionAnamnesisInput;
  body?: NutritionInitSectionPayload;
  treatmentPlan?: NutritionInitSectionPayload;
};

function asSection(
  value: NutritionInitSectionPayload | undefined,
): NutritionInitSectionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return { ...value };
}

@Injectable()
export class InitializePatientNutritionUseCase
  implements IUseCase<InitializePatientNutritionDto, PatientNutritionInitiationResult>
{
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
    private readonly nutritionInitStore: PatientNutritionInitiationStore,
    private readonly buildSnapshot: BuildTemplateQuestionsSnapshotService,
    private readonly validateAnswers: ValidatePatientAnamnesisAnswersService,
  ) {}

  async execute(
    dto: InitializePatientNutritionDto,
  ): Promise<PatientNutritionInitiationResult> {
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        InitializePatientNutritionUseCase.name,
        dto.patientId,
      );
    }

    const treatment = await this.treatmentRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.treatmentId,
    );
    if (!treatment) {
      throw new PatientTreatmentNotFoundError(
        InitializePatientNutritionUseCase.name,
        dto.treatmentId,
      );
    }

    const professionalName = dto.professionalName?.trim() ?? '';
    const body = asSection(dto.body);
    const treatmentPlan = asSection(dto.treatmentPlan);
    const templateAnamnesis = await this.buildTemplateAnamnesis(dto);
    const procedureName =
      treatment.treatmentName?.trim() ||
      treatment.description?.trim() ||
      'Procedimento';

    const evolution = TreatmentEvolution.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      source: 'nutrition_init',
      treatmentId: treatment.id,
      description: procedureName,
      valueCents: treatment.valueCents,
      professionalId: dto.professionalId,
      professionalName,
      finalizedAt: dto.initiatedAt,
      // Card "Última evolução" / timeline: sempre o nome do procedimento — não
      // concatenar Observações das seções (conteúdo clínico imprevisível).
      evolutionNotes: procedureName,
    });

    const history = EvolutionHistory.create({
      storeId: dto.storeId,
      evolutionId: evolution.id,
      action: 'created',
      professionalId: dto.professionalId,
      professionalName,
      occurredAt: new Date(),
    });

    const now = new Date();
    const initiation: PatientNutritionInitiationResult = {
      id: randomUUID(),
      storeId: dto.storeId,
      patientId: dto.patientId,
      treatmentId: treatment.id,
      evolutionId: evolution.id,
      patientAnamnesisId: templateAnamnesis.record?.id ?? null,
      anamnesis: templateAnamnesis.section,
      body,
      treatmentPlan,
      professionalId: dto.professionalId,
      professionalName,
      initiatedAt: dto.initiatedAt,
      createdAt: now,
      updatedAt: now,
    };

    return this.nutritionInitStore.save({
      initiation,
      evolution,
      history,
      patientAnamnesis: templateAnamnesis.record,
    });
  }

  private async buildTemplateAnamnesis(
    dto: InitializePatientNutritionDto,
  ): Promise<{
    section: NutritionInitSectionPayload;
    record?: PatientAnamnesis;
  }> {
    const templateId = dto.anamnesis?.templateId?.trim();
    if (!templateId) {
      return { section: {} };
    }

    const snapshot = await this.buildSnapshot.execute(
      InitializePatientNutritionUseCase.name,
      dto.storeId,
      templateId,
    );

    const answers = this.validateAnswers.validateProfessionalCreate(
      InitializePatientNutritionUseCase.name,
      dto.anamnesis?.consultationReason,
      dto.anamnesis?.answers,
      snapshot.formQuestions,
    );
    const consultationReason = dto.anamnesis?.consultationReason?.trim() || null;

    const record = PatientAnamnesis.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      templateId,
      templateName: snapshot.templateName,
      issuedAt: toIssuedAtDate(dto.initiatedAt),
      status: 'issued',
      fillingMode: 'professional',
      consultationReason,
      questionsSnapshot: snapshot.questionsSnapshot,
      answers,
    });

    return {
      section: {
        templateId,
        templateName: snapshot.templateName,
        consultationReason,
        questions: snapshot.questionsSnapshot,
        answers,
      },
      record,
    };
  }
}
