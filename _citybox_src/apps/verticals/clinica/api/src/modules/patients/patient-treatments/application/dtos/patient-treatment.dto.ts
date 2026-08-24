import type { PatientTreatmentLocationType } from '../../domain/entities/patient-treatment.entity';

export interface PatientTreatmentScopeDto {
  storeId: string;
  patientId: string;
}

export interface ListPatientTreatmentsDto extends PatientTreatmentScopeDto {}

export interface CreatePatientTreatmentDto extends PatientTreatmentScopeDto {
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName?: string;
  valueCents: number;
  locationType: PatientTreatmentLocationType;
  locationLabel: string;
}

export interface UpdatePatientTreatmentDto extends PatientTreatmentScopeDto {
  id: string;
  diagnosis: string;
  observation: string;
}

export interface DeletePatientTreatmentDto extends PatientTreatmentScopeDto {
  id: string;
}

export interface ReorderPatientTreatmentsDto extends PatientTreatmentScopeDto {
  orderedIds: string[];
}

export interface FinalizePatientTreatmentDto extends PatientTreatmentScopeDto {
  /** Um ou mais procedimentos; lote gera uma única evolução. */
  ids: string[];
  professionalId: string;
  professionalName?: string;
  finalizedAt: Date;
  evolutionNotes: string;
}
