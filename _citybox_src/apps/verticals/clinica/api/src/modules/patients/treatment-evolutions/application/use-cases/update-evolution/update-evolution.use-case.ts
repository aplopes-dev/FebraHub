import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../domain/repositories/treatment-evolution.repository.interface';
import type { TreatmentEvolution } from '../../../domain/entities/treatment-evolution.entity';
import { EvolutionHistory } from '../../../domain/entities/evolution-history.entity';
import { TreatmentEvolutionNotFoundError } from '../../../domain/errors/treatment-evolution-not-found.error';
import { TreatmentEvolutionConfirmedError } from '../../../domain/errors/treatment-evolution-confirmed.error';
import type { UpdateTreatmentEvolutionDto } from '../../../application/dtos/treatment-evolution.dto';

@Injectable()
export class UpdateTreatmentEvolutionUseCase implements IUseCase<
  UpdateTreatmentEvolutionDto,
  TreatmentEvolution
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
  ) {}

  async execute(dto: UpdateTreatmentEvolutionDto): Promise<TreatmentEvolution> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const evolution = await this.evolutionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.id,
    );
    if (!evolution) {
      throw new TreatmentEvolutionNotFoundError(
        UpdateTreatmentEvolutionUseCase.name,
        dto.id,
      );
    }

    if (evolution.isConfirmed) {
      throw new TreatmentEvolutionConfirmedError(
        UpdateTreatmentEvolutionUseCase.name,
        dto.id,
      );
    }

    evolution.updateStandalone({
      professionalId: dto.professionalId,
      professionalName: dto.professionalName?.trim() ?? '',
      finalizedAt: dto.finalizedAt,
      evolutionNotes: dto.evolutionNotes,
    });

    const saved = await this.evolutionRepository.save(evolution);

    await this.evolutionRepository.appendHistory(
      EvolutionHistory.create({
        storeId: dto.storeId,
        evolutionId: saved.id,
        action: 'edited',
        professionalId: dto.professionalId,
        professionalName: dto.professionalName?.trim() ?? '',
        occurredAt: new Date(),
      }),
    );

    return saved;
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        UpdateTreatmentEvolutionUseCase.name,
        patientId,
      );
    }
  }
}
