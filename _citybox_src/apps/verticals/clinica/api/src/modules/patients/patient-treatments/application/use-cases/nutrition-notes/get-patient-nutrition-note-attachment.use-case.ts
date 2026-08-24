import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientNutritionNoteStore } from '../../ports/patient-nutrition-note.store';
import { PatientNutritionNoteNotFoundError } from '../../../domain/errors/patient-nutrition-note-not-found.error';

export type GetPatientNutritionNoteAttachmentDto = {
  storeId: string;
  patientId: string;
  noteId: string;
};

export type PatientNutritionNoteAttachmentContent = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

@Injectable()
export class GetPatientNutritionNoteAttachmentUseCase
  implements
    IUseCase<
      GetPatientNutritionNoteAttachmentDto,
      PatientNutritionNoteAttachmentContent
    >
{
  constructor(
    private readonly noteStore: PatientNutritionNoteStore,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetPatientNutritionNoteAttachmentDto,
  ): Promise<PatientNutritionNoteAttachmentContent> {
    const note = await this.noteStore.findById(
      dto.storeId,
      dto.patientId,
      dto.noteId,
    );
    if (!note?.attachment) {
      throw new PatientNutritionNoteNotFoundError(
        GetPatientNutritionNoteAttachmentUseCase.name,
        dto.noteId,
      );
    }

    const stored = await this.storage.get(note.attachment.objectKey);

    return {
      name: note.attachment.name,
      mimeType: note.attachment.mimeType,
      buffer: stored.buffer,
    };
  }
}
