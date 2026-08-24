import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { ExternalReferralProfessional } from '../../../domain/entities/external-referral-professional.entity';
import { ExternalReferralProfessionalRepository } from '../../../domain/repositories/external-referral-professional.repository.interface';
import type { ListPatientExternalProfessionalsDto } from '../../dtos/patient-external-professional.dto';

@Injectable()
export class ListPatientExternalProfessionalsUseCase
  implements
    IUseCase<
      ListPatientExternalProfessionalsDto,
      ExternalReferralProfessional[]
    >
{
  constructor(
    private readonly repository: ExternalReferralProfessionalRepository,
  ) {}

  async execute(
    dto: ListPatientExternalProfessionalsDto,
  ): Promise<ExternalReferralProfessional[]> {
    return this.repository.findAll(dto.storeId);
  }
}
