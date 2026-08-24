import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientAnamnesis } from '../../../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import type { PatientAnamnesisPublicContext } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import { PatientAnamnesisLinkExpiredError } from '../../../domain/errors/patient-anamnesis-link-expired.error';
import type { FindPublicAnamnesisByTokenDto } from '../../dtos/patient-anamnesis.dto';

export type FindPublicAnamnesisByTokenResult = {
  anamnesis: PatientAnamnesis;
  patientName: string;
  clinicDisplayName: string;
};

@Injectable()
export class FindPublicAnamnesisByTokenUseCase implements IUseCase<
  FindPublicAnamnesisByTokenDto,
  FindPublicAnamnesisByTokenResult
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
  ) {}

  async execute(
    dto: FindPublicAnamnesisByTokenDto,
  ): Promise<FindPublicAnamnesisByTokenResult> {
    const context = await this.findContext(dto.publicToken);
    this.assertLinkNotExpired(FindPublicAnamnesisByTokenUseCase.name, context);
    return {
      anamnesis: context.anamnesis,
      patientName: context.patientName,
      clinicDisplayName: context.clinicDisplayName,
    };
  }

  private async findContext(
    publicToken: string,
  ): Promise<PatientAnamnesisPublicContext> {
    const normalized = publicToken.trim();
    if (!normalized) {
      throw new PatientAnamnesisNotFoundError(
        FindPublicAnamnesisByTokenUseCase.name,
        'token',
      );
    }

    const context =
      await this.anamnesisRepository.findByPublicToken(normalized);
    if (!context) {
      throw new PatientAnamnesisNotFoundError(
        FindPublicAnamnesisByTokenUseCase.name,
        'token',
      );
    }

    return context;
  }

  private assertLinkNotExpired(
    context: string,
    record: PatientAnamnesisPublicContext,
  ): void {
    const { anamnesis } = record;
    if (
      anamnesis.linkExpiresAt &&
      anamnesis.linkExpiresAt.getTime() < Date.now()
    ) {
      throw new PatientAnamnesisLinkExpiredError(context, anamnesis.id);
    }
  }
}
