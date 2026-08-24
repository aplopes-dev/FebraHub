import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientAnamnesis } from '../../../domain/entities/patient-anamnesis.entity';
import type { PatientAnamnesisAnswer } from '../../../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { BuildTemplateQuestionsSnapshotService } from '../../services/build-template-questions-snapshot.service';
import { ValidatePatientAnamnesisAnswersService } from '../../services/validate-patient-anamnesis-answers.service';
import {
  getPatientAnamnesisLinkExpiresAt,
  toIssuedAtDate,
} from '../../utils/patient-anamnesis-dates';
import type { CreatePatientAnamnesisDto } from '../../dtos/patient-anamnesis.dto';

@Injectable()
export class CreatePatientAnamnesisUseCase implements IUseCase<
  CreatePatientAnamnesisDto,
  PatientAnamnesis
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly buildSnapshot: BuildTemplateQuestionsSnapshotService,
    private readonly validateAnswers: ValidatePatientAnamnesisAnswersService,
  ) {}

  async execute(dto: CreatePatientAnamnesisDto): Promise<PatientAnamnesis> {
    await this.assertPatientExists.execute(
      CreatePatientAnamnesisUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    this.validateAnswers.validateFillingMode(
      CreatePatientAnamnesisUseCase.name,
      dto.input.fillingMode,
    );

    const snapshot = await this.buildSnapshot.execute(
      CreatePatientAnamnesisUseCase.name,
      dto.storeId,
      dto.input.templateId,
    );

    const issuedAt = toIssuedAtDate();
    const isPatientFilling = dto.input.fillingMode === 'patient';

    let answers: PatientAnamnesisAnswer[] | null = null;
    let consultationReason: string | null = null;
    let publicToken: string | null = null;
    let linkExpiresAt: Date | null = null;
    let status: 'issued' | 'awaiting_response' = 'issued';

    if (isPatientFilling) {
      status = 'awaiting_response';
      publicToken = randomUUID();
      linkExpiresAt = getPatientAnamnesisLinkExpiresAt();
    } else {
      answers = this.validateAnswers.validateProfessionalCreate(
        CreatePatientAnamnesisUseCase.name,
        dto.input.consultationReason,
        dto.input.answers,
        snapshot.formQuestions,
      );
      consultationReason = dto.input.consultationReason?.trim() || null;
    }

    const anamnesis = PatientAnamnesis.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      templateId: dto.input.templateId,
      templateName: snapshot.templateName,
      issuedAt,
      status,
      fillingMode: dto.input.fillingMode,
      consultationReason,
      questionsSnapshot: snapshot.questionsSnapshot,
      answers,
      publicToken,
      linkExpiresAt,
    });

    return this.anamnesisRepository.save(anamnesis);
  }
}
