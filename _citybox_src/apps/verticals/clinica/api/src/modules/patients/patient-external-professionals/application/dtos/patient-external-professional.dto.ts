export type ListPatientExternalProfessionalsDto = {
  storeId: string;
};

export type CreatePatientExternalProfessionalDto = {
  storeId: string;
  name: string;
  phone?: string;
  cro?: string;
};

export type UpdatePatientExternalProfessionalDto = {
  storeId: string;
  id: string;
  name: string;
  phone?: string;
  cro?: string;
};

export type DeletePatientExternalProfessionalDto = {
  storeId: string;
  id: string;
};
