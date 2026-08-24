import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';

export type GetNfeXmlDto = {
  fiscalDocumentId: string;
};

export type GetNfeXmlResult = {
  buffer: Buffer;
  mimeType: string;
};

/// FR-010 — disponibiliza o XML autorizado já armazenado (SC-003).
@Injectable()
export class GetNfeXmlUseCase implements IUseCase<
  GetNfeXmlDto,
  GetNfeXmlResult
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: GetNfeXmlDto): Promise<GetNfeXmlResult> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document || !document.xmlObjectKey) {
      throw new FiscalDocumentNotFoundError(
        GetNfeXmlUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    const stored = await this.objectStorage.get(document.xmlObjectKey);
    return { buffer: stored.buffer, mimeType: 'application/xml' };
  }
}
