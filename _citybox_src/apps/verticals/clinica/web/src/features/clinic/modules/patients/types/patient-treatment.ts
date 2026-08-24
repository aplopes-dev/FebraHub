export type PatientTreatmentSource = 'standalone' | 'budget';

export type PatientTreatmentStatus = 'active' | 'finalized';

export type PatientTreatment = {
  id: string;
  patientId: string;
  source: PatientTreatmentSource;
  status: PatientTreatmentStatus;
  description: string;
  valueCents: number;
  budgetId?: string;
  treatmentItemId?: string;
  toothNumber?: number;
  locationType?: 'tooth' | 'body_region' | 'session' | 'none';
  locationLabel?: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  treatmentId?: string;
  treatmentName?: string;
  planId?: string;
  planName?: string;
  professionalId?: string;
  professionalName?: string;
  finalizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  diagnosis?: string;
  observation?: string;
};

export type PatientTreatmentEditFormValues = {
  diagnosis: string;
  observation: string;
};

export const EMPTY_PATIENT_TREATMENT_EDIT_FORM_VALUES: PatientTreatmentEditFormValues = {
  diagnosis: '',
  observation: '',
};

export type PatientTreatmentFinalizeFormValues = {
  professionalId: string;
  finalizedDate: Date | null;
  evolutionNotes: string;
};

export const EMPTY_PATIENT_TREATMENT_FINALIZE_FORM_VALUES: PatientTreatmentFinalizeFormValues = {
  professionalId: '',
  finalizedDate: null,
  evolutionNotes: '',
};

export type PatientTreatmentFinalizePayload = {
  treatmentIds: string[];
  professionalId: string;
  professionalName: string;
  finalizedAt: string;
  evolutionNotes: string;
};

export type PatientTreatmentEvolutionHistoryAction = 'created' | 'edited';

export type PatientTreatmentEvolutionHistoryEntry = {
  id: string;
  professionalId?: string;
  professionalName: string;
  action: PatientTreatmentEvolutionHistoryAction;
  occurredAt: string;
};

export type PatientTreatmentEvolution = {
  id: string;
  treatmentId: string;
  patientId: string;
  source: PatientTreatmentSource;
  /** Fonte crua da API (inclui `nutrition_init`). */
  apiSource?: 'treatment' | 'standalone' | 'nutrition_init';
  description: string;
  valueCents: number;
  finalizedAt: string;
  professionalId?: string;
  professionalName?: string;
  evolutionNotes: string;
  signatureStatus: 'unsigned' | 'pending' | 'signed';
  signatureRequestId?: string;
  actionHistory?: PatientTreatmentEvolutionHistoryEntry[];
};

export type PatientStandaloneEvolutionFormValues = {
  professionalId: string;
  evolutionDate: Date | null;
  evolutionNotes: string;
};

export const EMPTY_PATIENT_STANDALONE_EVOLUTION_FORM_VALUES: PatientStandaloneEvolutionFormValues =
  {
    professionalId: '',
    evolutionDate: null,
    evolutionNotes: '',
  };

export type PatientStandaloneEvolutionPayload = {
  professionalId: string;
  professionalName: string;
  finalizedAt: string;
  evolutionNotes: string;
};

export type PatientStandaloneTreatmentDraft = {
  planId: string;
  treatmentId: string;
  value: string;
  professionalId: string;
  toothNumbers: number[];
  regionLabels: string[];
  hofRegionIds: string[];
};

export const EMPTY_PATIENT_STANDALONE_TREATMENT_DRAFT: PatientStandaloneTreatmentDraft = {
  planId: '',
  treatmentId: '',
  value: '',
  professionalId: '',
  toothNumbers: [],
  regionLabels: [],
  hofRegionIds: [],
};
