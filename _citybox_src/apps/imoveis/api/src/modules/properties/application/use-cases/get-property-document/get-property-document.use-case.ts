import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyDocumentNotFoundError } from '../../../domain/errors/property-document-not-found.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type GetPropertyDocumentInput = {
  storeId: string;
  propertyId: string;
  documentId: string;
};

export type GetPropertyDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

@Injectable()
export class GetPropertyDocumentUseCase implements IUseCase<
  GetPropertyDocumentInput,
  GetPropertyDocumentResult
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: GetPropertyDocumentInput,
  ): Promise<GetPropertyDocumentResult> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    const document = await this.properties.findDocument(
      input.storeId,
      input.propertyId,
      input.documentId,
    );
    if (!document?.objectKey) {
      throw new PropertyDocumentNotFoundError(
        GetPropertyDocumentUseCase.name,
        input.documentId,
      );
    }

    const stored = await this.storage.get(document.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType || document.mimeType,
      name: document.name,
    };
  }
}
