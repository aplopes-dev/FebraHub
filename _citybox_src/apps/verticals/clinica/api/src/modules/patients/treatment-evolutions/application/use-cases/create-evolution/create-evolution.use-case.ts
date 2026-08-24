import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../domain/repositories/treatment-evolution.repository.interface';
import {
  TreatmentEvolution,
  STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
} from '../../../domain/entities/treatment-evolution.entity';
import { EvolutionHistory } from '../../../domain/entities/evolution-history.entity';
import type { CreateStandaloneEvolutionDto } from '../../../application/dtos/treatment-evolution.dto';

@Injectable()
export class CreateTreatmentEvolutionUseCase implements IUseCase<
  CreateStandaloneEvolutionDto,
  TreatmentEvolution
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
  ) {}

  async execute(
    dto: CreateStandaloneEvolutionDto,
  ): Promise<TreatmentEvolution> {
    const patient = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundError(
        CreateTreatmentEvolutionUseCase.name,
        dto.patientId,
      );
    }

    const evolution = TreatmentEvolution.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      source: 'standalone',
      treatmentId: null,
      description: STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
      valueCents: 0,
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
        action: 'created',
        professionalId: dto.professionalId,
        professionalName: dto.professionalName?.trim() ?? '',
        occurredAt: new Date(),
      }),
    );

    return saved;
  }
}
