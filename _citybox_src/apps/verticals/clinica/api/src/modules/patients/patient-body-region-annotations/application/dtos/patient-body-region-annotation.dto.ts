export type CreatePatientBodyRegionAnnotationInput = {
  bodyRegionId: string;
  content: string;
  professionalId?: string;
  professionalName: string;
};

export interface CreatePatientBodyRegionAnnotationDto {
  storeId: string;
  patientId: string;
  input: CreatePatientBodyRegionAnnotationInput;
}

export interface ListPatientBodyRegionAnnotationsDto {
  storeId: string;
  patientId: string;
  bodyRegionId?: string;
}

export interface DeletePatientBodyRegionAnnotationDto {
  storeId: string;
  patientId: string;
  annotationId: string;
}
