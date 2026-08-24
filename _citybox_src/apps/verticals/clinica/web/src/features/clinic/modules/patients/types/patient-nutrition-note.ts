export type PatientNutritionNoteAttachment = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** URL já apontando para o proxy autenticado da clínica. */
  contentUrl: string | null;
};

export type PatientNutritionNote = {
  id: string;
  patientId: string;
  evolutionId: string;
  /** HTML do editor de texto. */
  content: string;
  attachment: PatientNutritionNoteAttachment | null;
  professionalId: string | null;
  professionalName: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientNutritionNoteApiItem = Omit<
  PatientNutritionNote,
  'attachment'
> & {
  attachment: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    contentPath: string;
  } | null;
};

export type SavePatientNutritionNoteInput = {
  evolutionId: string;
  /** Ausente ao criar; presente ao editar. */
  noteId?: string;
  content: string;
  professionalId?: string | null;
  professionalName?: string;
  /** Quando ausente, o anexo atual da nota é mantido. */
  file?: File | null;
};
