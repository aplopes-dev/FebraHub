import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { FinancialEntryAttachmentNotFoundError } from '../../../domain/errors/financial-entry-attachment-not-found.error';
import { FinancialEntryAttachmentRepository } from '../../../domain/repositories/financial-entry-attachment.repository.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import type { GetFinancialEntryAttachmentDto } from '../../dtos/financial-entry-attachment.dto';
import { assertFinancialEntryExists } from '../assert-financial-entry-exists';

export type GetFinancialEntryAttachmentResult = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

@Injectable()
export class GetFinancialEntryAttachmentUseCase implements IUseCase<
  GetFinancialEntryAttachmentDto,
  GetFinancialEntryAttachmentResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly attachmentRepository: FinancialEntryAttachmentRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetFinancialEntryAttachmentDto,
  ): Promise<GetFinancialEntryAttachmentResult> {
    const entry = await assertFinancialEntryExists(
      this.financialEntryRepository,
      dto.organizationId,
      dto.financialEntryId,
    );

    const attachment = await this.attachmentRepository.findById(
      dto.organizationId,
      entry.id,
      dto.attachmentId,
    );
    if (!attachment) {
      throw new FinancialEntryAttachmentNotFoundError(dto.attachmentId);
    }

    const stored = await this.storage.get(attachment.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType,
      fileName: attachment.fileName,
    };
  }
}
