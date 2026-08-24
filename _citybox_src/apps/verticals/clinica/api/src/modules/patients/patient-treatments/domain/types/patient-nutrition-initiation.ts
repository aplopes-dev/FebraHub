export type NutritionInitSectionPayload = Record<string, unknown>;

export type NutritionInitSectionKey = 'anamnesis' | 'body' | 'treatmentPlan';

export type PatientNutritionInitiationProps = {
  storeId: string;
  patientId: string;
  treatmentId: string;
  evolutionId: string;
  anamnesis: NutritionInitSectionPayload;
  body: NutritionInitSectionPayload;
  treatmentPlan: NutritionInitSectionPayload;
  professionalId: string | null;
  professionalName: string;
  initiatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PatientNutritionInitiationResult = PatientNutritionInitiationProps & {
  id: string;
  patientAnamnesisId?: string | null;
};

/** Metadados do card na evolução — sem o conteúdo das seções. */
export type PatientNutritionInitiationSummary = {
  id: string;
  patientId: string;
  treatmentId: string;
  evolutionId: string;
  professionalId: string | null;
  professionalName: string;
  initiatedAt: Date;
  filledSections: NutritionInitSectionKey[];
};
