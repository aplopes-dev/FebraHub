import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { LeadEntity } from '../../../domain/entities/lead.entity';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import { ImoveisObjectKeyPolicy } from '../../../../properties/application/policies/imoveis-object-key.policy';
import { DocumentFileValidator } from '../../../../properties/application/validators/document-file.validator';
import { formatFileSizeLabel } from '../../../../settings/application/policies/file-size-label';

export type UploadLeadDocumentInput = {
  storeId: string;
  leadId: string;
  buffer: Buffer;
  filename: string;
  kind?: 'contract' | 'other';
  activityMessage?: string;
};

@Injectable()
export class UploadLeadDocumentUseCase implements IUseCase<
  UploadLeadDocumentInput,
  LeadEntity
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly storage: ObjectStorage,
    private readonly syncActiveDeal: SyncActiveDealForLeadUseCase,
  ) {}

  async execute(input: UploadLeadDocumentInput): Promise<LeadEntity> {
    const name = DocumentFileValidator.sanitizeName(input.filename);
    const mimeType = DocumentFileValidator.validate(input.buffer, name);
    const lead = await this.leads.findById(input.storeId, input.leadId);
    if (!lead) throw new LeadNotFoundError(input.leadId);

    const documentId = randomUUID();
    const objectKey = ImoveisObjectKeyPolicy.leadDocumentKey(
      input.storeId,
      input.leadId,
      documentId,
      mimeType,
    );
    await this.storage.put({
      key: objectKey,
      buffer: input.buffer,
      mimeType,
    });
    const updated = await this.leads.addDocument(
      input.storeId,
      input.leadId,
      {
        id: documentId,
        name,
        sizeLabel: formatFileSizeLabel(input.buffer.length),
        kind: input.kind === 'contract' ? 'contract' : 'other',
        addedAt: new Date(),
        objectKey,
        mimeType,
      },
      input.activityMessage,
    );
    if (!updated) {
      await this.storage.delete(objectKey);
      throw new LeadNotFoundError(input.leadId);
    }
    await this.syncActiveDeal.execute(updated);
    return updated;
  }
}
