import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyDocumentLimitError } from '../../../domain/errors/property-document-limit.error';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';
import { ImoveisObjectKeyPolicy } from '../../policies/imoveis-object-key.policy';
import { DocumentFileValidator } from '../../validators/document-file.validator';

export const MAX_PROPERTY_DOCUMENTS = 12;

export type UploadPropertyDocumentInput = {
  storeId: string;
  propertyId: string;
  buffer: Buffer;
  filename: string;
};

/** Mesmo formato do label exibido no web (`formatFileSizeLabel`). */
function formatSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

@Injectable()
export class UploadPropertyDocumentUseCase implements IUseCase<
  UploadPropertyDocumentInput,
  PropertyEntity
> {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: UploadPropertyDocumentInput): Promise<PropertyEntity> {
    const name = DocumentFileValidator.sanitizeName(input.filename);
    const mimeType = DocumentFileValidator.validate(input.buffer, name);

    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    if (property.documents.length >= MAX_PROPERTY_DOCUMENTS) {
      throw new PropertyDocumentLimitError(
        UploadPropertyDocumentUseCase.name,
        MAX_PROPERTY_DOCUMENTS,
      );
    }

    const documentId = randomUUID();
    const objectKey = ImoveisObjectKeyPolicy.propertyDocumentKey(
      input.storeId,
      input.propertyId,
      documentId,
      mimeType,
    );

    await this.storage.put({
      key: objectKey,
      buffer: input.buffer,
      mimeType,
    });

    const updated = await this.properties.addDocument(
      input.storeId,
      input.propertyId,
      {
        id: documentId,
        name,
        sizeLabel: formatSizeLabel(input.buffer.length),
        objectKey,
        mimeType,
      },
    );
    if (!updated) {
      await this.storage.delete(objectKey);
      throw new PropertyNotFoundError(input.propertyId);
    }

    return updated;
  }
}
