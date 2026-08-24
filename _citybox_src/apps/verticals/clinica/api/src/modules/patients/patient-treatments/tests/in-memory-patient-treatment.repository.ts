/* eslint-disable @typescript-eslint/require-await */
import { PatientTreatmentRepository } from '../domain/repositories/patient-treatment.repository.interface';
import type {
  StandaloneActiveTreatmentRow,
  StandaloneActiveTreatmentsInRangeCriteria,
} from '../domain/repositories/patient-treatment.repository.interface';
import {
  PatientTreatment,
  type PatientTreatmentProps,
} from '../domain/entities/patient-treatment.entity';
import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';

export class InMemoryPatientTreatmentRepository extends PatientTreatmentRepository {
  private readonly treatments = new Map<string, PatientTreatment>();
  private readonly patientNames = new Map<string, string>();

  seedPatientName(patientId: string, name: string): void {
    this.patientNames.set(patientId, name);
  }

  async findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<PatientTreatment | null> {
    const treatment = this.treatments.get(id);
    if (
      !treatment ||
      treatment.storeId !== storeId ||
      treatment.patientId !== patientId
    ) {
      return null;
    }
    return treatment;
  }

  async findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientTreatment[]> {
    return [...this.treatments.values()]
      .filter(
        (item) => item.storeId === storeId && item.patientId === patientId,
      )
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  async getMaxSortOrder(storeId: string, patientId: string): Promise<number> {
    const items = await this.findByPatient(storeId, patientId);
    if (items.length === 0) return -1;
    return Math.max(...items.map((item) => item.sortOrder));
  }

  async save(treatment: PatientTreatment): Promise<PatientTreatment> {
    this.treatments.set(treatment.id, treatment);
    return treatment;
  }

  async saveMany(treatments: PatientTreatment[]): Promise<PatientTreatment[]> {
    for (const treatment of treatments) {
      this.treatments.set(treatment.id, treatment);
    }
    return treatments;
  }

  async delete(storeId: string, patientId: string, id: string): Promise<void> {
    const treatment = await this.findById(storeId, patientId, id);
    if (treatment) {
      this.treatments.delete(id);
    }
  }

  async listStandaloneActiveInRange(
    storeId: string,
    criteria: StandaloneActiveTreatmentsInRangeCriteria,
  ): Promise<StandaloneActiveTreatmentRow[]> {
    return [...this.treatments.values()]
      .filter((treatment) => {
        if (
          treatment.storeId !== storeId ||
          treatment.status !== 'active' ||
          treatment.source !== 'standalone'
        ) {
          return false;
        }
        const created = toIsoDateOnly(treatment.createdAt);
        return (
          created >= criteria.startIsoDate && created <= criteria.endIsoDate
        );
      })
      .map((treatment) => ({
        treatment,
        patientName: this.patientNames.get(treatment.patientId) ?? 'Paciente',
      }));
  }

  seed(
    props: Omit<
      PatientTreatmentProps,
      | 'createdAt'
      | 'updatedAt'
      | 'source'
      | 'status'
      | 'budgetId'
      | 'budgetItemId'
      | 'sessionIndex'
      | 'sessionTotal'
    > &
      Partial<
        Pick<
          PatientTreatmentProps,
          | 'source'
          | 'status'
          | 'budgetId'
          | 'budgetItemId'
          | 'createdAt'
          | 'sessionIndex'
          | 'sessionTotal'
        >
      >,
    id?: string,
  ): PatientTreatment {
    const treatment = PatientTreatment.create(props, id);
    this.treatments.set(treatment.id, treatment);
    return treatment;
  }
}
