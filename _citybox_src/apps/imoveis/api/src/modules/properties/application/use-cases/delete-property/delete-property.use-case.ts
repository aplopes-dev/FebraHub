import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

@Injectable()
export class DeletePropertyUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<void> {
    const property = await this.properties.findById(storeId, id);
    if (!property) throw new PropertyNotFoundError(id);

    for (const photo of property.photos) {
      await this.storage.delete(photo.objectKey);
    }
    for (const document of property.documents) {
      if (document.objectKey) {
        await this.storage.delete(document.objectKey);
      }
    }

    const ok = await this.properties.delete(storeId, id);
    if (!ok) throw new PropertyNotFoundError(id);
  }
}
