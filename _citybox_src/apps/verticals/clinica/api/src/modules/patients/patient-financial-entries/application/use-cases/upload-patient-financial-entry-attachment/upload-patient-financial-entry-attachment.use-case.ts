import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFileMimeValidator } from '../../../../patient-files/application/validators/patient-file-mime.validator';
import { PatientFileObjectKeyPolicy } from '../../../../patient-files/application/policies/patient-file-object-key.policy';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import type { PatientFinancialDebitAttachment } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { PatientFinancialEntryFrozenError } from '../../../domain/errors/patient-financial-entry-frozen.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';

export type UploadPatientFinancialEntryAttachmentDto = {
  storeId: string;
  patientId: string;
  entryId: string;
  name: string;
  buffer: Buffer;
  declaredMimeType: string;
};

@Injectable()
export class UploadPatientFinancialEntryAttachmentUseCase
  implements IUseCase<UploadPatientFinancialEntryAttachmentDto, PatientFinancialEntry>
{
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: UploadPatientFinancialEntryAttachmentDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      UploadPatientFinancialEntryAttachmentUseCase.name,
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
        UploadPatientFinancialEntryAttachmentUseCase.name,
        dto.entryId,
      );
    }
    if (!existingRaw.isEditablePendingDebit()) {
      throw new PatientFinancialEntryFrozenError(
        UploadPatientFinancialEntryAttachmentUseCase.name,
        dto.entryId,
        existingRaw.status === 'received' ? 'received' : 'not_editable',
      );
    }

    const existing = await this.hydrateDebitDetail.hydrateOne(existingRaw);
    const mimeType = PatientFileMimeValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
      UploadPatientFinancialEntryAttachmentUseCase.name,
    );
    const attachmentId = randomUUID();
    const objectKey = `${dto.storeId}/patients/${dto.patientId}/financial-entries/${dto.entryId}/${attachmentId}.${PatientFileObjectKeyPolicy.extensionFromMime(mimeType)}`;

    await this.storage.put({
      key: objectKey,
      buffer: dto.buffer,
      mimeType,
    });

    const attachment: PatientFinancialDebitAttachment = {
      id: attachmentId,
      name: dto.name.trim() || 'arquivo',
      objectKey,
      mimeType,
      sizeBytes: dto.buffer.length,
    };

    const currentDetail = existing.debitDetail ?? {
      observations: '',
      treatments: [],
    };
    const attachments = [...(currentDetail.attachments ?? []), attachment];

    const updated = existing.withPendingDebitUpdate({
      valueCents: existing.valueCents,
      debitDetail: {
        ...currentDetail,
        attachments,
      },
    });

    return this.entryRepository.save(updated);
  }
}
