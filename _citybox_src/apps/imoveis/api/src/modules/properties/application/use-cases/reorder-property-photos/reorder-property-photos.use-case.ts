import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { resolvePhotoOrder } from '../../policies/resolve-photo-order';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type ReorderPropertyPhotosInput = {
  storeId: string;
  propertyId: string;
  photoIds: readonly string[];
};

@Injectable()
export class ReorderPropertyPhotosUseCase implements IUseCase<
  ReorderPropertyPhotosInput,
  PropertyEntity
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute(input: ReorderPropertyPhotosInput): Promise<PropertyEntity> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    const currentIds = property.photos.map((photo) => photo.id);
    const photoIds = resolvePhotoOrder(currentIds, input.photoIds);

    const updated = await this.properties.reorderPhotos(
      input.storeId,
      input.propertyId,
      photoIds,
    );
    if (!updated) {
      throw new PropertyNotFoundError(input.propertyId);
    }
    return updated;
  }
}
