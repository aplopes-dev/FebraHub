export type PatientToothAnnotationApiItem = {
  id: string;
  patientId: string;
  toothNumber: number;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: string;
};

export type PatientToothAnnotationCreateBody = {
  toothNumber: number;
  content: string;
  professionalId?: string;
  professionalName: string;
};
