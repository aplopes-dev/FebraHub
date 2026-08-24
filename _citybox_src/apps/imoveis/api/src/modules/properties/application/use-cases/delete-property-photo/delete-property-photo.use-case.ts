import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyPhotoNotFoundError } from '../../../domain/errors/property-photo-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type DeletePropertyPhotoInput = {
  storeId: string;
  propertyId: string;
  photoId: string;
};

@Injectable()
export class DeletePropertyPhotoUseCase implements IUseCase<
  DeletePropertyPhotoInput,
  PropertyEntity
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: DeletePropertyPhotoInput): Promise<PropertyEntity> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    const photo = await this.properties.removePhoto(
      input.storeId,
      input.propertyId,
      input.photoId,
    );
    if (!photo) {
      throw new PropertyPhotoNotFoundError(
        DeletePropertyPhotoUseCase.name,
        input.photoId,
      );
    }

    await this.storage.delete(photo.objectKey);

    const updated = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!updated) {
      throw new PropertyNotFoundError(input.propertyId);
    }
    return updated;
  }
}
