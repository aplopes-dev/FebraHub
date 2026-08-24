import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ClinicStoreProfileRepository } from '../../../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicProfileHasNoLogoError } from '../../../domain/errors/clinic-profile.errors';
import type { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';
import type { DeleteClinicLogoDto } from '../../dtos/clinic-profile.dto';

@Injectable()
export class DeleteClinicLogoUseCase implements IUseCase<
  DeleteClinicLogoDto,
  ClinicStoreProfile
> {
  constructor(
    private readonly repository: ClinicStoreProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteClinicLogoDto): Promise<ClinicStoreProfile> {
    const profile = await this.repository.findByStoreId(dto.storeId);
    if (!profile?.hasLogo()) {
      throw new ClinicProfileHasNoLogoError(
        DeleteClinicLogoUseCase.name,
        dto.storeId,
      );
    }

    await this.storage.delete(profile.logoObjectKey!);
    profile.clearLogo();
    return this.repository.save(profile);
  }
}
