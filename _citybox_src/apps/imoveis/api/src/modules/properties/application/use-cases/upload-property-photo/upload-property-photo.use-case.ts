import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyPhotoLimitError } from '../../../domain/errors/property-photo-limit.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';
import { ImoveisObjectKeyPolicy } from '../../policies/imoveis-object-key.policy';
import { ImageFileValidator } from '../../validators/image-file.validator';

export const MAX_PROPERTY_PHOTOS = 20;

export type UploadPropertyPhotoInput = {
  storeId: string;
  propertyId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

@Injectable()
export class UploadPropertyPhotoUseCase implements IUseCase<
  UploadPropertyPhotoInput,
  PropertyEntity
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: UploadPropertyPhotoInput): Promise<PropertyEntity> {
    const mimeType = ImageFileValidator.validate(
      input.buffer,
      input.declaredMimeType,
    );

    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    if (property.photos.length >= MAX_PROPERTY_PHOTOS) {
      throw new PropertyPhotoLimitError(
        UploadPropertyPhotoUseCase.name,
        MAX_PROPERTY_PHOTOS,
      );
    }

    const photoId = randomUUID();
    const objectKey = ImoveisObjectKeyPolicy.propertyPhotoKey(
      input.storeId,
      input.propertyId,
      photoId,
      mimeType,
    );

    await this.storage.put({
      key: objectKey,
      buffer: input.buffer,
      mimeType,
    });

    const updated = await this.properties.addPhoto(
      input.storeId,
      input.propertyId,
      { id: photoId, objectKey, mimeType },
    );
    if (!updated) {
      await this.storage.delete(objectKey);
      throw new PropertyNotFoundError(input.propertyId);
    }

    return updated;
  }
}
