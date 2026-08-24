import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';
import type { GetClinicProfileDto } from '../../dtos/clinic-profile.dto';

@Injectable()
export class GetClinicProfileUseCase implements IUseCase<
  GetClinicProfileDto,
  ClinicStoreProfile
> {
  constructor(private readonly repository: ClinicStoreProfileRepository) {}

  async execute(dto: GetClinicProfileDto): Promise<ClinicStoreProfile> {
    const profile = await this.repository.findByStoreId(dto.storeId);
    return profile ?? ClinicStoreProfile.defaults(dto.storeId);
  }
}
