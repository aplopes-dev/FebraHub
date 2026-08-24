export type ClinicContractFormData = {
  name: string;
  isDefault: boolean;
  content: string;
};

export type ClinicContractFormPatch = Partial<ClinicContractFormData>;

export type ClinicContractFormErrors = Partial<Record<'name', string>>;

export type ClinicContractSheetSuccessPayload = {
  name: string;
  isDefault: boolean;
  content: string;
  templateId?: string;
};
