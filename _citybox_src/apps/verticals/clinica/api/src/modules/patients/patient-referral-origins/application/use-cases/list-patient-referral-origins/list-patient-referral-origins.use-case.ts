import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  PatientReferralOrigin,
  SYSTEM_REFERRAL_ORIGINS,
} from '../../../domain/entities/patient-referral-origin.entity';
import { PatientReferralOriginRepository } from '../../../domain/repositories/patient-referral-origin.repository.interface';
import type { ListPatientReferralOriginsDto } from '../../dtos/patient-referral-origin.dto';

@Injectable()
export class ListPatientReferralOriginsUseCase
  implements IUseCase<ListPatientReferralOriginsDto, PatientReferralOrigin[]>
{
  constructor(
    private readonly repository: PatientReferralOriginRepository,
  ) {}

  async execute(
    dto: ListPatientReferralOriginsDto,
  ): Promise<PatientReferralOrigin[]> {
    await this.ensureSystemOrigins(dto.storeId);
    return this.repository.findAll(dto.storeId);
  }

  private async ensureSystemOrigins(storeId: string): Promise<void> {
    const existing = await this.repository.findAll(storeId);
    const present = new Set(
      existing
        .map((origin) => origin.systemKey)
        .filter((key): key is NonNullable<typeof key> => key != null),
    );

    const missing = SYSTEM_REFERRAL_ORIGINS.filter(
      (item) => !present.has(item.systemKey),
    );
    if (missing.length === 0) return;

    await this.repository.saveMany(
      missing.map((item) =>
        PatientReferralOrigin.create({
          storeId,
          name: item.name,
          systemKey: item.systemKey,
          isSystem: true,
        }),
      ),
    );
  }
}
