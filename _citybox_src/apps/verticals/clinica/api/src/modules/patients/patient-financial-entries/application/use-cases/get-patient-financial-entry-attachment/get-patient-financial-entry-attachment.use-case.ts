import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';

export type GetPatientFinancialEntryAttachmentDto = {
  storeId: string;
  patientId: string;
  entryId: string;
  attachmentId: string;
};

export type PatientFinancialEntryAttachmentContent = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

@Injectable()
export class GetPatientFinancialEntryAttachmentUseCase
  implements
    IUseCase<
      GetPatientFinancialEntryAttachmentDto,
      PatientFinancialEntryAttachmentContent
    >
{
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetPatientFinancialEntryAttachmentDto,
  ): Promise<PatientFinancialEntryAttachmentContent> {
    await this.assertPatientExists.execute(
      GetPatientFinancialEntryAttachmentUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existingRaw = await this.entryRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.entryId,
    );
    if (!existingRaw) {
      throw new PatientFinancialEntryNotFoundError(
        GetPatientFinancialEntryAttachmentUseCase.name,
        dto.entryId,
      );
    }

    const existing = await this.hydrateDebitDetail.hydrateOne(existingRaw);
    const attachment = existing.debitDetail?.attachments?.find(
      (item) => item.id === dto.attachmentId,
    );
    if (!attachment) {
      throw new ValidatorDomainError({
        internalMessage: `Attachment not found: ${dto.attachmentId}`,
        externalMessage: 'Anexo não encontrado',
        context: GetPatientFinancialEntryAttachmentUseCase.name,
      });
    }

    const stored = await this.storage.get(attachment.objectKey);
    return {
      name: attachment.name,
      mimeType: attachment.mimeType,
      buffer: stored.buffer,
    };
  }
}
