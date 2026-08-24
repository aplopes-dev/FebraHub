import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientNutritionNoteStore } from '../../ports/patient-nutrition-note.store';
import type { PatientNutritionNoteResult } from '../../../domain/types/patient-nutrition-note';

export type ListPatientNutritionNotesDto = {
  storeId: string;
  patientId: string;
  evolutionId: string;
};

@Injectable()
export class ListPatientNutritionNotesUseCase
  implements
    IUseCase<ListPatientNutritionNotesDto, PatientNutritionNoteResult[]>
{
  constructor(private readonly noteStore: PatientNutritionNoteStore) {}

  async execute(
    dto: ListPatientNutritionNotesDto,
  ): Promise<PatientNutritionNoteResult[]> {
    return this.noteStore.listByEvolution(
      dto.storeId,
      dto.patientId,
      dto.evolutionId,
    );
  }
}
