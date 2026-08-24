import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ClinicStoreProfileRepository } from '../../../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicProfileHasNoLogoError } from '../../../domain/errors/clinic-profile.errors';
import type { GetClinicLogoDto } from '../../dtos/clinic-profile.dto';

export type GetClinicLogoResult = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetClinicLogoUseCase implements IUseCase<
  GetClinicLogoDto,
  GetClinicLogoResult
> {
  constructor(
    private readonly repository: ClinicStoreProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: GetClinicLogoDto): Promise<GetClinicLogoResult> {
    const profile = await this.repository.findByStoreId(dto.storeId);
    if (!profile?.hasLogo()) {
      throw new ClinicProfileHasNoLogoError(
        GetClinicLogoUseCase.name,
        dto.storeId,
      );
    }

    const stored = await this.storage.get(profile.logoObjectKey!);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
