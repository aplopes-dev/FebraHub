import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../domain/repositories/treatment-evolution.repository.interface';
import type { EvolutionHistory } from '../../../domain/entities/evolution-history.entity';
import { TreatmentEvolutionNotFoundError } from '../../../domain/errors/treatment-evolution-not-found.error';
import type { GetEvolutionHistoryDto } from '../../../application/dtos/treatment-evolution.dto';

@Injectable()
export class GetEvolutionHistoryUseCase implements IUseCase<
  GetEvolutionHistoryDto,
  EvolutionHistory[]
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
  ) {}

  async execute(dto: GetEvolutionHistoryDto): Promise<EvolutionHistory[]> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const evolution = await this.evolutionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.id,
    );
    if (!evolution) {
      throw new TreatmentEvolutionNotFoundError(
        GetEvolutionHistoryUseCase.name,
        dto.id,
      );
    }

    const history = await this.evolutionRepository.findHistoryByEvolutionId(
      dto.storeId,
      dto.id,
    );

    return [...history].sort(
      (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
    );
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        GetEvolutionHistoryUseCase.name,
        patientId,
      );
    }
  }
}
