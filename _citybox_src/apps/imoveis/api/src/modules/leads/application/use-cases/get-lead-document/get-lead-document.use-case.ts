import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { LeadDocumentFileUnavailableError } from '../../../domain/errors/lead-document-file-unavailable.error';
import { LeadDocumentNotFoundError } from '../../../domain/errors/lead-document-not-found.error';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';

export type GetLeadDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

@Injectable()
export class GetLeadDocumentUseCase implements IUseCase<
  { storeId: string; leadId: string; documentId: string },
  GetLeadDocumentResult
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: {
    storeId: string;
    leadId: string;
    documentId: string;
  }): Promise<GetLeadDocumentResult> {
    const lead = await this.leads.findById(input.storeId, input.leadId);
    if (!lead) throw new LeadNotFoundError(input.leadId);
    const document = await this.leads.findDocument(
      input.storeId,
      input.leadId,
      input.documentId,
    );
    if (!document) throw new LeadDocumentNotFoundError(input.documentId);
    if (!document.objectKey) {
      throw new LeadDocumentFileUnavailableError(
        GetLeadDocumentUseCase.name,
        input.documentId,
      );
    }
    const stored = await this.storage.get(document.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType || document.mimeType || 'application/pdf',
      name: document.name,
    };
  }
}
