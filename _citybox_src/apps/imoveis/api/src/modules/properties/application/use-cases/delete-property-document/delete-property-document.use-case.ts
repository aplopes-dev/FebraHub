import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyDocumentNotFoundError } from '../../../domain/errors/property-document-not-found.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type DeletePropertyDocumentInput = {
  storeId: string;
  propertyId: string;
  documentId: string;
};

@Injectable()
export class DeletePropertyDocumentUseCase implements IUseCase<
  DeletePropertyDocumentInput,
  PropertyEntity
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: DeletePropertyDocumentInput): Promise<PropertyEntity> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    const document = await this.properties.removeDocument(
      input.storeId,
      input.propertyId,
      input.documentId,
    );
    if (!document) {
      throw new PropertyDocumentNotFoundError(
        DeletePropertyDocumentUseCase.name,
        input.documentId,
      );
    }

    if (document.objectKey) {
      await this.storage.delete(document.objectKey);
    }

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
