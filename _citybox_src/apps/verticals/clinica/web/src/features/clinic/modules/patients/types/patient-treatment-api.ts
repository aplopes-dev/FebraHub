export type PatientTreatmentApiSource = 'budget' | 'standalone';

export type PatientTreatmentApiStatus = 'active' | 'completed';

export type PatientTreatmentApiLocationType = 'tooth' | 'body_region' | 'session' | 'none';

export type PatientTreatmentApiItem = {
  id: string;
  patientId: string;
  source: PatientTreatmentApiSource;
  status: PatientTreatmentApiStatus;
  budgetId: string | null;
  budgetItemId: string | null;
  planId: string | null;
  treatmentId: string | null;
  professionalId: string | null;
  professionalName: string;
  planName: string;
  treatmentName: string;
  description: string;
  valueCents: number;
  locationType: PatientTreatmentApiLocationType;
  locationLabel: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  diagnosis: string;
  observation: string;
  sortOrder: number;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatientTreatmentCreateBody = {
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName?: string;
  valueCents: number;
  locationType: PatientTreatmentApiLocationType;
  locationLabel: string;
};

export type PatientTreatmentUpdateBody = {
  diagnosis: string;
  observation: string;
};

export type PatientTreatmentReorderBody = {
  orderedIds: string[];
};

export type PatientTreatmentFinalizeBody = {
  treatmentIds: string[];
  professionalId: string;
  professionalName?: string;
  finalizedAt: string;
  evolutionNotes: string;
};

export type TreatmentEvolutionApiSource =
  | 'treatment'
  | 'standalone'
  | 'nutrition_init';

export type TreatmentEvolutionApiItem = {
  id: string;
  patientId: string;
  treatmentId: string | null;
  source: TreatmentEvolutionApiSource;
  description: string;
  valueCents: number | null;
  evolutionNotes: string;
  professionalId: string | null;
  professionalName: string;
  finalizedAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  confirmationHash: string | null;
  signatureStatus: 'unsigned' | 'pending' | 'signed';
  signatureRequestId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TreatmentEvolutionCreateBody = {
  professionalId: string;
  professionalName?: string;
  finalizedAt: string;
  evolutionNotes: string;
};

export type TreatmentEvolutionUpdateBody = TreatmentEvolutionCreateBody;

export type TreatmentEvolutionHistoryApiAction = 'created' | 'edited' | 'confirmed';

export type TreatmentEvolutionHistoryApiItem = {
  id: string;
  evolutionId: string;
  action: TreatmentEvolutionHistoryApiAction;
  professionalId: string | null;
  professionalName: string;
  occurredAt: string;
  createdAt: string;
};
