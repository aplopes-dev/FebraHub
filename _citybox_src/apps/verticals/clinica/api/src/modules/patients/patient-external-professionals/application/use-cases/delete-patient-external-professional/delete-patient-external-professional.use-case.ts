import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ExternalReferralProfessionalRepository } from '../../../domain/repositories/external-referral-professional.repository.interface';
import { ExternalReferralProfessionalNotFoundError } from '../../../domain/errors/external-referral-professional-not-found.error';
import type { DeletePatientExternalProfessionalDto } from '../../dtos/patient-external-professional.dto';

@Injectable()
export class DeletePatientExternalProfessionalUseCase
  implements IUseCase<DeletePatientExternalProfessionalDto, void>
{
  constructor(
    private readonly repository: ExternalReferralProfessionalRepository,
  ) {}

  async execute(dto: DeletePatientExternalProfessionalDto): Promise<void> {
    const current = await this.repository.findById(dto.storeId, dto.id);
    if (!current) {
      throw new ExternalReferralProfessionalNotFoundError(
        DeletePatientExternalProfessionalUseCase.name,
        dto.id,
      );
    }

    await this.repository.delete(dto.storeId, dto.id);
  }
}
