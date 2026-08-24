import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { LeadDocumentNotFoundError } from '../../../domain/errors/lead-document-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import { isLeadDocumentShareExpired } from '../../policies/document-share.policy';

export type GetPublicLeadDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

@Injectable()
export class GetPublicLeadDocumentUseCase implements IUseCase<
  { token: string; now?: Date },
  GetPublicLeadDocumentResult
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: {
    token: string;
    now?: Date;
  }): Promise<GetPublicLeadDocumentResult> {
    const found = await this.leads.findDocumentByShareToken(input.token);
    if (!found || !found.document.objectKey) {
      throw new LeadDocumentNotFoundError(input.token);
    }
    const now = input.now ?? new Date();
    if (isLeadDocumentShareExpired(found.document.shareExpiresAt, now)) {
      throw new LeadDocumentNotFoundError(input.token);
    }
    try {
      const stored = await this.storage.get(found.document.objectKey);
      return {
        buffer: stored.buffer,
        mimeType:
          stored.mimeType || found.document.mimeType || 'application/pdf',
        name: found.document.name,
      };
    } catch {
      throw new LeadDocumentNotFoundError(input.token);
    }
  }
}
