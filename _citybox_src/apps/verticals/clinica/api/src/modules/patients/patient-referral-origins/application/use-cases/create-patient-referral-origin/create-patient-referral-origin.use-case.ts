import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  PatientReferralOrigin,
  SYSTEM_REFERRAL_ORIGINS,
} from '../../../domain/entities/patient-referral-origin.entity';
import { PatientReferralOriginRepository } from '../../../domain/repositories/patient-referral-origin.repository.interface';
import { PatientReferralOriginNameTakenError } from '../../../domain/errors/patient-referral-origin-name-taken.error';
import type { CreatePatientReferralOriginDto } from '../../dtos/patient-referral-origin.dto';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';

@Injectable()
export class CreatePatientReferralOriginUseCase
  implements
    IUseCase<CreatePatientReferralOriginDto, PatientReferralOrigin>
{
  constructor(
    private readonly repository: PatientReferralOriginRepository,
  ) {}

  async execute(
    dto: CreatePatientReferralOriginDto,
  ): Promise<PatientReferralOrigin> {
    const name = dto.name.trim();
    if (!name) {
      throw new ValidatorDomainError({
        internalMessage: 'Empty referral origin name',
        externalMessage: 'Informe o nome da origem',
        context: CreatePatientReferralOriginUseCase.name,
      });
    }

    const normalized = name.toLocaleLowerCase('pt-BR');
    const clashesSystem = SYSTEM_REFERRAL_ORIGINS.some(
      (item) => item.name.toLocaleLowerCase('pt-BR') === normalized,
    );
    if (clashesSystem) {
      throw new PatientReferralOriginNameTakenError(
        CreatePatientReferralOriginUseCase.name,
        name,
      );
    }

    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing) {
      throw new PatientReferralOriginNameTakenError(
        CreatePatientReferralOriginUseCase.name,
        name,
      );
    }

    const origin = PatientReferralOrigin.create({
      storeId: dto.storeId,
      name,
      systemKey: null,
      isSystem: false,
    });

    return this.repository.save(origin);
  }
}
