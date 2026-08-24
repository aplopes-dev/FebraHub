import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyPhotoNotFoundError } from '../../../domain/errors/property-photo-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type GetPropertyPhotoInput = {
  storeId: string;
  propertyId: string;
  photoId: string;
};

export type GetPropertyPhotoResult = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetPropertyPhotoUseCase implements IUseCase<
  GetPropertyPhotoInput,
  GetPropertyPhotoResult
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: GetPropertyPhotoInput): Promise<GetPropertyPhotoResult> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    const photo = await this.properties.findPhoto(
      input.storeId,
      input.propertyId,
      input.photoId,
    );
    if (!photo) {
      throw new PropertyPhotoNotFoundError(
        GetPropertyPhotoUseCase.name,
        input.photoId,
      );
    }

    const stored = await this.storage.get(photo.objectKey);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
