export type CreatePatientToothAnnotationInput = {
  toothNumber: number;
  content: string;
  professionalId?: string;
  professionalName: string;
};

export interface CreatePatientToothAnnotationDto {
  storeId: string;
  patientId: string;
  input: CreatePatientToothAnnotationInput;
}

export interface ListPatientToothAnnotationsDto {
  storeId: string;
  patientId: string;
  toothNumber?: number;
}

export interface DeletePatientToothAnnotationDto {
  storeId: string;
  patientId: string;
  annotationId: string;
}
