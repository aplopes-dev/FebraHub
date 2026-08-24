export type PatientBodyRegionAnnotationApiItem = {
  id: string;
  patientId: string;
  bodyRegionId: string;
  content: string;
  professionalId: string;
  professionalName: string;
  createdAt: string;
};

export type PatientBodyRegionAnnotationCreateBody = {
  bodyRegionId: string;
  content: string;
  professionalId?: string;
  professionalName: string;
};
