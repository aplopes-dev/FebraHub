import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ExternalReferralProfessional } from '../../../domain/entities/external-referral-professional.entity';
import { ExternalReferralProfessionalRepository } from '../../../domain/repositories/external-referral-professional.repository.interface';
import { ExternalReferralProfessionalNameTakenError } from '../../../domain/errors/external-referral-professional-name-taken.error';
import { ExternalReferralProfessionalNotFoundError } from '../../../domain/errors/external-referral-professional-not-found.error';
import type { UpdatePatientExternalProfessionalDto } from '../../dtos/patient-external-professional.dto';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { onlyDigits } from '../../../../../../shared/core/utils/brazilian-document.utils';

@Injectable()
export class UpdatePatientExternalProfessionalUseCase
  implements
    IUseCase<UpdatePatientExternalProfessionalDto, ExternalReferralProfessional>
{
  constructor(
    private readonly repository: ExternalReferralProfessionalRepository,
  ) {}

  async execute(
    dto: UpdatePatientExternalProfessionalDto,
  ): Promise<ExternalReferralProfessional> {
    const current = await this.repository.findById(dto.storeId, dto.id);
    if (!current) {
      throw new ExternalReferralProfessionalNotFoundError(
        UpdatePatientExternalProfessionalUseCase.name,
        dto.id,
      );
    }

    const name = dto.name.trim();
    if (!name) {
      throw new ValidatorDomainError({
        internalMessage: 'Empty external professional name',
        externalMessage: 'Informe o nome do profissional',
        context: UpdatePatientExternalProfessionalUseCase.name,
      });
    }

    if (name.length > 120) {
      throw new ValidatorDomainError({
        internalMessage: 'External professional name too long',
        externalMessage: 'Nome deve ter no máximo 120 caracteres',
        context: UpdatePatientExternalProfessionalUseCase.name,
      });
    }

    const phone = onlyDigits(dto.phone ?? '');
    const cro = (dto.cro ?? '').trim();
    if (cro.length > 32) {
      throw new ValidatorDomainError({
        internalMessage: 'External professional CRO too long',
        externalMessage: 'CRO deve ter no máximo 32 caracteres',
        context: UpdatePatientExternalProfessionalUseCase.name,
      });
    }

    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing && existing.id !== dto.id) {
      throw new ExternalReferralProfessionalNameTakenError(
        UpdatePatientExternalProfessionalUseCase.name,
        name,
      );
    }

    return this.repository.save(
      current.withUpdated({ name, phone, cro }),
    );
  }
}
