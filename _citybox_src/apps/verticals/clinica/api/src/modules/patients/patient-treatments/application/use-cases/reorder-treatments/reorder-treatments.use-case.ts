import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import type { PatientTreatment } from '../../../domain/entities/patient-treatment.entity';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import type { ReorderPatientTreatmentsDto } from '../../../application/dtos/patient-treatment.dto';

@Injectable()
export class ReorderPatientTreatmentsUseCase implements IUseCase<
  ReorderPatientTreatmentsDto,
  PatientTreatment[]
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(dto: ReorderPatientTreatmentsDto): Promise<PatientTreatment[]> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const treatments = await this.treatmentRepository.findByPatient(
      dto.storeId,
      dto.patientId,
    );
    const byId = new Map(treatments.map((item) => [item.id, item]));

    for (const id of dto.orderedIds) {
      if (!byId.has(id)) {
        throw new PatientTreatmentNotFoundError(
          ReorderPatientTreatmentsUseCase.name,
          id,
        );
      }
    }

    const reordered = dto.orderedIds.map((id, index) => {
      const treatment = byId.get(id)!;
      treatment.setSortOrder(index);
      return treatment;
    });

    const untouched = treatments
      .filter((item) => !dto.orderedIds.includes(item.id))
      .map((item, offset) => {
        item.setSortOrder(dto.orderedIds.length + offset);
        return item;
      });

    return this.treatmentRepository.saveMany([...reordered, ...untouched]);
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        ReorderPatientTreatmentsUseCase.name,
        patientId,
      );
    }
  }
}
