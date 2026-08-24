import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../domain/repositories/treatment-evolution.repository.interface';
import type { TreatmentEvolution } from '../../../domain/entities/treatment-evolution.entity';
import type { ListTreatmentEvolutionsDto } from '../../../application/dtos/treatment-evolution.dto';

@Injectable()
export class ListTreatmentEvolutionsUseCase implements IUseCase<
  ListTreatmentEvolutionsDto,
  TreatmentEvolution[]
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
  ) {}

  async execute(
    dto: ListTreatmentEvolutionsDto,
  ): Promise<TreatmentEvolution[]> {
    await this.assertPatientExists(dto.storeId, dto.patientId);
    const evolutions = await this.evolutionRepository.findByPatient(
      dto.storeId,
      dto.patientId,
    );
    return [...evolutions].sort(
      (left, right) => right.finalizedAt.getTime() - left.finalizedAt.getTime(),
    );
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        ListTreatmentEvolutionsUseCase.name,
        patientId,
      );
    }
  }
}
