import { Injectable } from '@nestjs/common';
import type { BudgetItem } from '../../domain/entities/budget-item.entity';
import { PatientTreatment } from '../../../patient-treatments/domain/entities/patient-treatment.entity';
import { PatientTreatmentRepository } from '../../../patient-treatments/domain/repositories/patient-treatment.repository.interface';

export type MaterializeBudgetTreatmentsInput = {
  storeId: string;
  patientId: string;
  budgetId: string;
  items: BudgetItem[];
};

@Injectable()
export class MaterializeBudgetTreatmentsService {
  constructor(
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(input: MaterializeBudgetTreatmentsInput): Promise<void> {
    if (input.items.length === 0) {
      return;
    }

    const existingTreatments = await this.treatmentRepository.findByPatient(
      input.storeId,
      input.patientId,
    );

    const materializedBudgetItemIds = new Set(
      existingTreatments
        .filter(
          (treatment) =>
            treatment.budgetId === input.budgetId &&
            treatment.budgetItemId !== null,
        )
        .map((treatment) => treatment.budgetItemId as string),
    );

    const pendingItems = [...input.items]
      .filter((item) => !materializedBudgetItemIds.has(item.id))
      .sort((left, right) => left.sortOrder - right.sortOrder);

    if (pendingItems.length === 0) {
      return;
    }

    let sortOrder = await this.treatmentRepository.getMaxSortOrder(
      input.storeId,
      input.patientId,
    );

    const treatments = pendingItems.map((item) => {
      sortOrder += 1;

      return PatientTreatment.create({
        storeId: input.storeId,
        patientId: input.patientId,
        source: 'budget',
        status: 'active',
        budgetId: input.budgetId,
        budgetItemId: item.id,
        planId: item.planId,
        treatmentId: item.treatmentId,
        professionalId: item.professionalId,
        professionalName: item.professionalName,
        planName: item.planName,
        treatmentName: item.treatmentName,
        description: item.treatmentName,
        valueCents: item.valueCents,
        locationType: item.locationType,
        locationLabel: item.locationLabel,
        sessionIndex: item.sessionIndex,
        sessionTotal: item.sessionTotal,
        sortOrder,
      });
    });

    await this.treatmentRepository.saveMany(treatments);
  }
}
