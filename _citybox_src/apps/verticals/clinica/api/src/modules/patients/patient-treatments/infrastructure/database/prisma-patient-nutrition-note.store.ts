import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type { PatientNutritionNoteResult } from '../../domain/types/patient-nutrition-note';
import { PatientNutritionNoteStore } from '../../application/ports/patient-nutrition-note.store';

type NutritionNoteRow = {
  id: string;
  storeId: string;
  patientId: string;
  evolutionId: string;
  content: string;
  fileName: string | null;
  fileObjectKey: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  professionalId: string | null;
  professionalName: string;
  createdAt: Date;
  updatedAt: Date;
};

function toResult(row: NutritionNoteRow): PatientNutritionNoteResult {
  return {
    id: row.id,
    storeId: row.storeId,
    patientId: row.patientId,
    evolutionId: row.evolutionId,
    content: row.content,
    attachment:
      row.fileObjectKey && row.fileName && row.fileMimeType
        ? {
            name: row.fileName,
            objectKey: row.fileObjectKey,
            mimeType: row.fileMimeType,
            sizeBytes: row.fileSizeBytes ?? 0,
          }
        : null,
    professionalId: row.professionalId,
    professionalName: row.professionalName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaPatientNutritionNoteStore extends PatientNutritionNoteStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(
    note: PatientNutritionNoteResult,
  ): Promise<PatientNutritionNoteResult> {
    const data = {
      storeId: note.storeId,
      patientId: note.patientId,
      evolutionId: note.evolutionId,
      content: note.content,
      fileName: note.attachment?.name ?? null,
      fileObjectKey: note.attachment?.objectKey ?? null,
      fileMimeType: note.attachment?.mimeType ?? null,
      fileSizeBytes: note.attachment?.sizeBytes ?? null,
      professionalId: note.professionalId,
      professionalName: note.professionalName,
    };

    const row = await this.prisma.patientNutritionNote.upsert({
      where: { id: note.id },
      create: { id: note.id, createdAt: note.createdAt, ...data },
      update: data,
    });

    return toResult(row);
  }

  async findById(
    storeId: string,
    patientId: string,
    noteId: string,
  ): Promise<PatientNutritionNoteResult | null> {
    const row = await this.prisma.patientNutritionNote.findFirst({
      where: { id: noteId, storeId, patientId },
    });
    return row ? toResult(row) : null;
  }

  async listByEvolution(
    storeId: string,
    patientId: string,
    evolutionId: string,
  ): Promise<PatientNutritionNoteResult[]> {
    const rows = await this.prisma.patientNutritionNote.findMany({
      where: { storeId, patientId, evolutionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResult);
  }
}
