/** Anexo opcional da nota — um arquivo por nota. */
export type PatientNutritionNoteAttachment = {
  name: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
};

export type PatientNutritionNoteResult = {
  id: string;
  storeId: string;
  patientId: string;
  evolutionId: string;
  /** HTML do editor de texto. */
  content: string;
  attachment: PatientNutritionNoteAttachment | null;
  professionalId: string | null;
  professionalName: string;
  createdAt: Date;
  updatedAt: Date;
};
