import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientNutritionInitiationStore } from '../../ports/patient-nutrition-initiation.store';
import type { PatientNutritionInitiationResult } from '../../../domain/types/patient-nutrition-initiation';
import { PatientNutritionInitiationNotFoundError } from '../../../domain/errors/patient-nutrition-initiation-not-found.error';

export type GetPatientNutritionInitiationDto = {
  storeId: string;
  patientId: string;
  evolutionId: string;
};

@Injectable()
export class GetPatientNutritionInitiationUseCase
  implements
    IUseCase<GetPatientNutritionInitiationDto, PatientNutritionInitiationResult>
{
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly nutritionInitStore: PatientNutritionInitiationStore,
  ) {}

  async execute(
    dto: GetPatientNutritionInitiationDto,
  ): Promise<PatientNutritionInitiationResult> {
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        GetPatientNutritionInitiationUseCase.name,
        dto.patientId,
      );
    }

    const initiation = await this.nutritionInitStore.findByEvolutionId(
      dto.storeId,
      dto.patientId,
      dto.evolutionId,
    );
    if (!initiation) {
      throw new PatientNutritionInitiationNotFoundError(
        GetPatientNutritionInitiationUseCase.name,
        dto.evolutionId,
      );
    }
    return initiation;
  }
}
