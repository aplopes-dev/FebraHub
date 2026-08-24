import type { PatientPrescription } from '../entities/patient-prescription.entity';

export type PatientPrescriptionListSortBy = 'issuedDate' | 'professionalName';

export type PatientPrescriptionListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: PatientPrescriptionListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export abstract class PatientPrescriptionRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    prescriptionId: string,
  ): Promise<PatientPrescription | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientPrescriptionListCriteria,
  ): Promise<PatientPrescription[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientPrescriptionListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(
    prescription: PatientPrescription,
  ): Promise<PatientPrescription>;

  abstract delete(
    storeId: string,
    patientId: string,
    prescriptionId: string,
  ): Promise<void>;
}
