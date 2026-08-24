import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFileMimeValidator } from '../../../../patient-files/application/validators/patient-file-mime.validator';
import { PatientFileObjectKeyPolicy } from '../../../../patient-files/application/policies/patient-file-object-key.policy';
import { PatientNutritionInitiationStore } from '../../ports/patient-nutrition-initiation.store';
import { PatientNutritionNoteStore } from '../../ports/patient-nutrition-note.store';
import { PatientNutritionInitiationNotFoundError } from '../../../domain/errors/patient-nutrition-initiation-not-found.error';
import { PatientNutritionNoteNotFoundError } from '../../../domain/errors/patient-nutrition-note-not-found.error';
import type { PatientNutritionNoteResult } from '../../../domain/types/patient-nutrition-note';

export type SavePatientNutritionNoteAttachment = {
  name: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type SavePatientNutritionNoteDto = {
  storeId: string;
  patientId: string;
  evolutionId: string;
  /** Ausente ao criar; presente ao editar uma nota existente. */
  noteId?: string | null;
  content: string;
  professionalId?: string | null;
  professionalName?: string;
  attachment?: SavePatientNutritionNoteAttachment | null;
};

/**
 * Cria ou edita a nota. O anexo anterior é mantido quando o profissional não
 * envia arquivo novo — a nota é registro clínico e não tem exclusão.
 */
@Injectable()
export class SavePatientNutritionNoteUseCase
  implements IUseCase<SavePatientNutritionNoteDto, PatientNutritionNoteResult>
{
  constructor(
    private readonly initiationStore: PatientNutritionInitiationStore,
    private readonly noteStore: PatientNutritionNoteStore,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: SavePatientNutritionNoteDto,
  ): Promise<PatientNutritionNoteResult> {
    const initiation = await this.initiationStore.findByEvolutionId(
      dto.storeId,
      dto.patientId,
      dto.evolutionId,
    );
    if (!initiation) {
      throw new PatientNutritionInitiationNotFoundError(
        SavePatientNutritionNoteUseCase.name,
        dto.evolutionId,
      );
    }

    const existing = dto.noteId
      ? await this.noteStore.findById(dto.storeId, dto.patientId, dto.noteId)
      : null;
    if (dto.noteId && !existing) {
      throw new PatientNutritionNoteNotFoundError(
        SavePatientNutritionNoteUseCase.name,
        dto.noteId,
      );
    }

    const now = new Date();
    const noteId = existing?.id ?? randomUUID();
    const attachment = dto.attachment
      ? await this.storeAttachment(dto, noteId, dto.attachment)
      : (existing?.attachment ?? null);

    return this.noteStore.save({
      id: noteId,
      storeId: dto.storeId,
      patientId: dto.patientId,
      evolutionId: dto.evolutionId,
      content: dto.content.trim(),
      attachment,
      professionalId: dto.professionalId ?? existing?.professionalId ?? null,
      professionalName:
        dto.professionalName?.trim() || existing?.professionalName || '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  private async storeAttachment(
    dto: SavePatientNutritionNoteDto,
    noteId: string,
    attachment: SavePatientNutritionNoteAttachment,
  ) {
    const mimeType = PatientFileMimeValidator.validate(
      attachment.buffer,
      attachment.declaredMimeType,
      SavePatientNutritionNoteUseCase.name,
    );
    const objectKey = `${dto.storeId}/patients/${dto.patientId}/nutrition-notes/${noteId}.${PatientFileObjectKeyPolicy.extensionFromMime(mimeType)}`;

    await this.storage.put({
      key: objectKey,
      buffer: attachment.buffer,
      mimeType,
    });

    return {
      name: attachment.name.trim() || 'arquivo',
      objectKey,
      mimeType,
      sizeBytes: attachment.buffer.length,
    };
  }
}
