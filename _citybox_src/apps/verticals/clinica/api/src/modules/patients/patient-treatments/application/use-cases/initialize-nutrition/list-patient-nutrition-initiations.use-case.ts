import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientNutritionInitiationStore } from '../../ports/patient-nutrition-initiation.store';
import type { PatientNutritionInitiationSummary } from '../../../domain/types/patient-nutrition-initiation';

export type ListPatientNutritionInitiationsDto = {
  storeId: string;
  patientId: string;
};

@Injectable()
export class ListPatientNutritionInitiationsUseCase
  implements
    IUseCase<
      ListPatientNutritionInitiationsDto,
      PatientNutritionInitiationSummary[]
    >
{
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly nutritionInitStore: PatientNutritionInitiationStore,
  ) {}

  async execute(
    dto: ListPatientNutritionInitiationsDto,
  ): Promise<PatientNutritionInitiationSummary[]> {
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        ListPatientNutritionInitiationsUseCase.name,
        dto.patientId,
      );
    }

    return this.nutritionInitStore.findSummariesByPatient(
      dto.storeId,
      dto.patientId,
    );
  }
}
