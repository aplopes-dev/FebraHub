import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ExternalReferralProfessional } from '../../../domain/entities/external-referral-professional.entity';
import { ExternalReferralProfessionalRepository } from '../../../domain/repositories/external-referral-professional.repository.interface';
import { ExternalReferralProfessionalNameTakenError } from '../../../domain/errors/external-referral-professional-name-taken.error';
import type { CreatePatientExternalProfessionalDto } from '../../dtos/patient-external-professional.dto';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { onlyDigits } from '../../../../../../shared/core/utils/brazilian-document.utils';

@Injectable()
export class CreatePatientExternalProfessionalUseCase
  implements
    IUseCase<CreatePatientExternalProfessionalDto, ExternalReferralProfessional>
{
  constructor(
    private readonly repository: ExternalReferralProfessionalRepository,
  ) {}

  async execute(
    dto: CreatePatientExternalProfessionalDto,
  ): Promise<ExternalReferralProfessional> {
    const name = dto.name.trim();
    if (!name) {
      throw new ValidatorDomainError({
        internalMessage: 'Empty external professional name',
        externalMessage: 'Informe o nome do profissional',
        context: CreatePatientExternalProfessionalUseCase.name,
      });
    }

    if (name.length > 120) {
      throw new ValidatorDomainError({
        internalMessage: 'External professional name too long',
        externalMessage: 'Nome deve ter no máximo 120 caracteres',
        context: CreatePatientExternalProfessionalUseCase.name,
      });
    }

    const phone = onlyDigits(dto.phone ?? '');
    const cro = (dto.cro ?? '').trim();
    if (cro.length > 32) {
      throw new ValidatorDomainError({
        internalMessage: 'External professional CRO too long',
        externalMessage: 'CRO deve ter no máximo 32 caracteres',
        context: CreatePatientExternalProfessionalUseCase.name,
      });
    }

    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing) {
      throw new ExternalReferralProfessionalNameTakenError(
        CreatePatientExternalProfessionalUseCase.name,
        name,
      );
    }

    const professional = ExternalReferralProfessional.create({
      storeId: dto.storeId,
      name,
      phone,
      cro,
    });

    return this.repository.save(professional);
  }
}
