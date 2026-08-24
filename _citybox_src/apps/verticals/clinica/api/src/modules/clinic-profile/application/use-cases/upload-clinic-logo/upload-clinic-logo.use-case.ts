import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ClinicObjectKeyPolicy } from '../../policies/clinic-object-key.policy';
import { ClinicStoreProfileRepository } from '../../../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';
import { ImageFileValidator } from '../../validators/image-file.validator';
import type { UploadClinicLogoDto } from '../../dtos/clinic-profile.dto';

@Injectable()
export class UploadClinicLogoUseCase implements IUseCase<
  UploadClinicLogoDto,
  ClinicStoreProfile
> {
  constructor(
    private readonly repository: ClinicStoreProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadClinicLogoDto): Promise<ClinicStoreProfile> {
    const mimeType = ImageFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    let profile = await this.repository.findByStoreId(dto.storeId);
    if (!profile) {
      profile = ClinicStoreProfile.defaults(dto.storeId);
    }

    if (profile.hasLogo()) {
      await this.storage.delete(profile.logoObjectKey!);
    }

    const key = ClinicObjectKeyPolicy.logoKey(dto.storeId, mimeType);

    await this.storage.put({
      key,
      buffer: dto.buffer,
      mimeType,
    });

    profile.setLogo(key, mimeType);
    return this.repository.save(profile);
  }
}
