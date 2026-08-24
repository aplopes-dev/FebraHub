import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientAnamnesis } from '../../../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import { PatientAnamnesisLinkExpiredError } from '../../../domain/errors/patient-anamnesis-link-expired.error';
import { PatientAnamnesisAlreadySubmittedError } from '../../../domain/errors/patient-anamnesis-already-submitted.error';
import { ValidatePatientAnamnesisAnswersService } from '../../services/validate-patient-anamnesis-answers.service';
import type { SubmitPublicAnamnesisDto } from '../../dtos/patient-anamnesis.dto';

@Injectable()
export class SubmitPublicAnamnesisUseCase implements IUseCase<
  SubmitPublicAnamnesisDto,
  PatientAnamnesis
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly validateAnswers: ValidatePatientAnamnesisAnswersService,
  ) {}

  async execute(dto: SubmitPublicAnamnesisDto): Promise<PatientAnamnesis> {
    const normalized = dto.publicToken.trim();
    if (!normalized) {
      throw new PatientAnamnesisNotFoundError(
        SubmitPublicAnamnesisUseCase.name,
        'token',
      );
    }

    const context =
      await this.anamnesisRepository.findByPublicToken(normalized);
    if (!context) {
      throw new PatientAnamnesisNotFoundError(
        SubmitPublicAnamnesisUseCase.name,
        'token',
      );
    }

    const { anamnesis } = context;

    if (
      anamnesis.linkExpiresAt &&
      anamnesis.linkExpiresAt.getTime() < Date.now()
    ) {
      throw new PatientAnamnesisLinkExpiredError(
        SubmitPublicAnamnesisUseCase.name,
        anamnesis.id,
      );
    }

    if (
      anamnesis.status !== 'awaiting_response' ||
      anamnesis.answers !== null
    ) {
      throw new PatientAnamnesisAlreadySubmittedError(
        SubmitPublicAnamnesisUseCase.name,
        anamnesis.id,
      );
    }

    const validated = this.validateAnswers.validatePublicSubmit(
      SubmitPublicAnamnesisUseCase.name,
      anamnesis.questionsSnapshot,
      dto.answers,
    );

    const updated = anamnesis.withSubmittedAnswers(
      validated.answers,
      validated.consultationReason,
    );

    return this.anamnesisRepository.save(updated);
  }
}
