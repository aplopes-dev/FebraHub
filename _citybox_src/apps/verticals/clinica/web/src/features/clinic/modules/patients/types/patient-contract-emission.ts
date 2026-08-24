export type PatientContractEmissionFormValues = {
  templateId: string;
  contractorName: string;
  contractorBirthDate: string;
  contractorCpf: string;
  contractorZip: string;
  contractorStreet: string;
  contractorNeighborhood: string;
  contractorCity: string;
  contractorState: string;
  contractedName: string;
  contractedDocument: string;
  contractedCity: string;
  contractValue: string;
  treatmentsDescription: string;
  contractDate: string;
  content: string;
};

export type PatientContractEmissionFormErrors = Partial<
  Record<keyof PatientContractEmissionFormValues, string>
>;

export type PatientContractFormSnapshot = Omit<PatientContractEmissionFormValues, 'content'>;

export type ContractSignatureStatus = 'unsigned' | 'pending' | 'signed';

export type PatientContractIssuedVia = 'manual';

export type PatientContractEmissionRecord = {
  id: string;
  patientId: string;
  budgetId?: string | null;
  templateId: string;
  templateName: string;
  content: string;
  issuedAt: string;
  issuedVia: PatientContractIssuedVia;
  responsibleName: string;
  patientName: string;
  responsibleSignatureStatus: ContractSignatureStatus;
  patientSignatureStatus: ContractSignatureStatus;
  formValues: PatientContractFormSnapshot;
};

export const EMPTY_PATIENT_CONTRACT_EMISSION_FORM_VALUES: PatientContractEmissionFormValues = {
  templateId: '',
  contractorName: '',
  contractorBirthDate: '',
  contractorCpf: '',
  contractorZip: '',
  contractorStreet: '',
  contractorNeighborhood: '',
  contractorCity: '',
  contractorState: '',
  contractedName: '',
  contractedDocument: '',
  contractedCity: '',
  contractValue: '',
  treatmentsDescription: '',
  contractDate: '',
  content: '',
};
