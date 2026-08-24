import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { GeneratedDocumentNotFoundError } from '../../../domain/errors/generated-document-not-found.error';
import { GeneratedDocumentRepository } from '../../../domain/repositories/generated-document.repository.interface';

export type GetGeneratedDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

@Injectable()
export class GetGeneratedDocumentUseCase implements IUseCase<
  { storeId: string; id: string },
  GetGeneratedDocumentResult
> {
  constructor(
    private readonly generated: GeneratedDocumentRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: {
    storeId: string;
    id: string;
  }): Promise<GetGeneratedDocumentResult> {
    const document = await this.generated.findById(input.storeId, input.id);
    if (!document) throw new GeneratedDocumentNotFoundError(input.id);
    const stored = await this.storage.get(document.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType || document.mimeType || 'application/pdf',
      name: `${document.titulo}.pdf`,
    };
  }
}
