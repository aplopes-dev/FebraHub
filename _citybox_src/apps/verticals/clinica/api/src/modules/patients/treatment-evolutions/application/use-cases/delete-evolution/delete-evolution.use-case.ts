import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../domain/repositories/treatment-evolution.repository.interface';
import { TreatmentEvolutionNotFoundError } from '../../../domain/errors/treatment-evolution-not-found.error';
import { TreatmentEvolutionConfirmedError } from '../../../domain/errors/treatment-evolution-confirmed.error';
import type { DeleteTreatmentEvolutionDto } from '../../../application/dtos/treatment-evolution.dto';

@Injectable()
export class DeleteTreatmentEvolutionUseCase implements IUseCase<
  DeleteTreatmentEvolutionDto,
  void
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
  ) {}

  async execute(dto: DeleteTreatmentEvolutionDto): Promise<void> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const evolution = await this.evolutionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.id,
    );
    if (!evolution) {
      throw new TreatmentEvolutionNotFoundError(
        DeleteTreatmentEvolutionUseCase.name,
        dto.id,
      );
    }

    if (evolution.isConfirmed) {
      throw new TreatmentEvolutionConfirmedError(
        DeleteTreatmentEvolutionUseCase.name,
        dto.id,
      );
    }

    await this.evolutionRepository.delete(dto.storeId, dto.patientId, dto.id);
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        DeleteTreatmentEvolutionUseCase.name,
        patientId,
      );
    }
  }
}
