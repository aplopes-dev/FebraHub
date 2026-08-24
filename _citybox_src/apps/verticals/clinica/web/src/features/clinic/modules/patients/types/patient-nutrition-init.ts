export type PatientNutritionInitSection = {
  notes?: string;
  [key: string]: unknown;
};

export type PatientNutritionInitSectionKey =
  | 'anamnesis'
  | 'body'
  | 'treatmentPlan';

export type PatientNutritionInitPayload = {
  treatmentId: string;
  professionalId: string;
  professionalName: string;
  initiatedAt: string;
  anamnesis: PatientNutritionInitSection;
  body: PatientNutritionInitSection;
  treatmentPlan: PatientNutritionInitSection;
};

/** Metadados do card na evolução, sem o conteúdo das seções. */
export type PatientNutritionInitiationSummaryApiItem = {
  id: string;
  patientId: string;
  treatmentId: string;
  evolutionId: string;
  professionalId: string | null;
  professionalName: string;
  initiatedAt: string;
  filledSections: PatientNutritionInitSectionKey[];
};

export type PatientNutritionInitiationApiItem = {
  id: string;
  storeId: string;
  patientId: string;
  treatmentId: string;
  evolutionId: string;
  patientAnamnesisId?: string | null;
  anamnesis: PatientNutritionInitSection;
  body: PatientNutritionInitSection;
  treatmentPlan: PatientNutritionInitSection;
  professionalId: string | null;
  professionalName: string;
  initiatedAt: string;
  createdAt: string;
  updatedAt: string;
};
