import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { TreatmentEvolution } from '../../../../treatment-evolutions/domain/entities/treatment-evolution.entity';
import { EvolutionHistory } from '../../../../treatment-evolutions/domain/entities/evolution-history.entity';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import { PatientTreatment } from '../../../domain/entities/patient-treatment.entity';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';
import { PatientTreatmentFinalizationStore } from '../../ports/patient-treatment-finalization.store';
import { AccrueCommissionsOnTreatmentCompletedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-treatment-completed.service';
import type { FinalizePatientTreatmentDto } from '../../dtos/patient-treatment.dto';

@Injectable()
export class FinalizePatientTreatmentUseCase implements IUseCase<
  FinalizePatientTreatmentDto,
  PatientTreatment[]
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
    private readonly finalizationStore: PatientTreatmentFinalizationStore,
    private readonly accrueCommissionsOnTreatmentCompleted: AccrueCommissionsOnTreatmentCompletedService,
  ) {}

  async execute(dto: FinalizePatientTreatmentDto): Promise<PatientTreatment[]> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const ids = [...new Set(dto.ids)];
    if (ids.length === 0) {
      throw new PatientTreatmentNotFoundError(
        FinalizePatientTreatmentUseCase.name,
        '',
      );
    }

    const treatments: PatientTreatment[] = [];
    for (const id of ids) {
      const treatment = await this.treatmentRepository.findById(
        dto.storeId,
        dto.patientId,
        id,
      );
      if (!treatment) {
        throw new PatientTreatmentNotFoundError(
          FinalizePatientTreatmentUseCase.name,
          id,
        );
      }
      if (treatment.isCompleted) {
        throw new PatientTreatmentCompletedError(
          FinalizePatientTreatmentUseCase.name,
          id,
        );
      }
      treatments.push(treatment);
    }

    const professionalName = dto.professionalName?.trim() ?? '';
    const evolutionNotes = dto.evolutionNotes.trim();
    const primary = treatments[0]!;

    for (const treatment of treatments) {
      treatment.finalize(dto.finalizedAt);
    }

    const description = treatments
      .map((treatment) => treatment.treatmentName || treatment.description)
      .filter((label) => label.trim().length > 0)
      .join(', ');

    const valueCents = treatments.reduce(
      (sum, treatment) => sum + treatment.valueCents,
      0,
    );

    const evolution = TreatmentEvolution.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      source: 'treatment',
      treatmentId: primary.id,
      description: description || primary.description,
      valueCents,
      professionalId: dto.professionalId,
      professionalName,
      finalizedAt: dto.finalizedAt,
      evolutionNotes,
    });

    const history = EvolutionHistory.create({
      storeId: dto.storeId,
      evolutionId: evolution.id,
      action: 'created',
      professionalId: dto.professionalId,
      professionalName,
      occurredAt: new Date(),
    });

    const finalized = await this.finalizationStore.execute({
      treatments,
      evolution,
      history,
    });

    // Comissão por procedimento (Tratamentos → Finalizar → evolução source=treatment).
    // Lote: 1 evolução, N accruals. CreateTreatmentEvolutionUseCase (avulsa) não chama o motor.
    for (const item of finalized) {
      await this.accrueCommissionsOnTreatmentCompleted.execute({
        storeId: dto.storeId,
        patientId: dto.patientId,
        patientTreatmentId: item.id,
        professionalId: item.professionalId || dto.professionalId,
        professionalName: item.professionalName.trim() || professionalName,
        planId: item.planId,
        planName: item.planName,
        treatmentId: item.treatmentId,
        treatmentName: item.treatmentName,
        locationLabel: item.locationLabel,
        valueCents: item.valueCents,
        finalizedAt: dto.finalizedAt,
      });
    }

    return finalized;
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        FinalizePatientTreatmentUseCase.name,
        patientId,
      );
    }
  }
}
