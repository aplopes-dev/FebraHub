import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyPhotoNotFoundError } from '../../../../properties/domain/errors/property-photo-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { isPublicCatalogPropertyStatus } from '../../policies/public-catalog-property.policy';

export type GetPublicListingPhotoInput = {
  storeId: string;
  listingId: string;
  photoId: string;
};

export type GetPublicListingPhotoResult = {
  buffer: Buffer;
  mimeType: string;
};

/**
 * Serve foto de imóvel se o status for publicável (`available`).
 * Não exige TeamMember no agentId do imóvel — agent_ids legados/demo não
 * devem bloquear a mídia da vitrine.
 */
@Injectable()
export class GetPublicListingPhotoUseCase implements IUseCase<
  GetPublicListingPhotoInput,
  GetPublicListingPhotoResult
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: GetPublicListingPhotoInput,
  ): Promise<GetPublicListingPhotoResult> {
    const property = await this.properties.findById(
      input.storeId,
      input.listingId,
    );
    if (!property || !isPublicCatalogPropertyStatus(property.status)) {
      throw new PropertyNotFoundError(input.listingId);
    }

    const photo = await this.properties.findPhoto(
      input.storeId,
      input.listingId,
      input.photoId,
    );
    if (!photo) {
      throw new PropertyPhotoNotFoundError(
        GetPublicListingPhotoUseCase.name,
        input.photoId,
      );
    }

    const stored = await this.storage.get(photo.objectKey);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
