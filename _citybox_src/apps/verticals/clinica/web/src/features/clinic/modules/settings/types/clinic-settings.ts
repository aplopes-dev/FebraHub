export type ClinicSettingsFormData = {
  clinicName: string;
  cnpj: string;
  communicationsName: string;
  responsible: string;
  logoUrl?: string;

  openingTime: string;
  closingTime: string;

  email: string;
  phone: string;
  mobile: string;

  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ClinicSettingsFormPatch = Partial<ClinicSettingsFormData>;
