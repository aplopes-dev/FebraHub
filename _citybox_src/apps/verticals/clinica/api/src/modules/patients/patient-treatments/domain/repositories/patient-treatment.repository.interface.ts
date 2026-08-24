import type { PatientTreatment } from '../entities/patient-treatment.entity';

export type StandaloneActiveTreatmentsInRangeCriteria = {
  /** Inclusive ISO yyyy-MM-dd — matched against createdAt (civil date). */
  startIsoDate: string;
  endIsoDate: string;
};

export type StandaloneActiveTreatmentRow = {
  treatment: PatientTreatment;
  patientName: string;
};

export abstract class PatientTreatmentRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<PatientTreatment | null>;

  abstract findByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientTreatment[]>;

  abstract getMaxSortOrder(storeId: string, patientId: string): Promise<number>;

  abstract save(treatment: PatientTreatment): Promise<PatientTreatment>;

  abstract saveMany(
    treatments: PatientTreatment[],
  ): Promise<PatientTreatment[]>;

  abstract delete(
    storeId: string,
    patientId: string,
    id: string,
  ): Promise<void>;

  /**
   * Store-wide active treatments with source=standalone whose createdAt
   * civil date falls in [startIsoDate, endIsoDate].
   */
  abstract listStandaloneActiveInRange(
    storeId: string,
    criteria: StandaloneActiveTreatmentsInRangeCriteria,
  ): Promise<StandaloneActiveTreatmentRow[]>;
}
