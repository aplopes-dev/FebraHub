import type { ClinicPatient } from '../types/clinic-patient';
import type { PatientContractEmissionFormValues } from '../types/patient-contract-emission';

export type ContractVariableGapField =
  | 'contractorName'
  | 'contractorBirthDate'
  | 'contractorCpf'
  | 'contractorZip'
  | 'contractorStreet'
  | 'contractorNeighborhood'
  | 'contractorCity'
  | 'contractorState'
  | 'contractedName'
  | 'contractedDocument'
  | 'contractedCity';

const LABELS: Record<ContractVariableGapField, string> = {
  contractorName: 'Nome do paciente',
  contractorBirthDate: 'Data de nascimento',
  contractorCpf: 'CPF',
  contractorZip: 'CEP',
  contractorStreet: 'Rua',
  contractorNeighborhood: 'Bairro',
  contractorCity: 'Cidade',
  contractorState: 'Estado',
  contractedName: 'Nome da clínica',
  contractedDocument: 'CNPJ da clínica',
  contractedCity: 'Cidade da clínica',
};

export function listMissingContractVariableFields(
  values: Pick<
    PatientContractEmissionFormValues,
    ContractVariableGapField
  >,
): ContractVariableGapField[] {
  const fields: ContractVariableGapField[] = [
    'contractorName',
    'contractorBirthDate',
    'contractorCpf',
    'contractorZip',
    'contractorStreet',
    'contractorNeighborhood',
    'contractorCity',
    'contractorState',
    'contractedName',
    'contractedDocument',
    'contractedCity',
  ];
  return fields.filter((field) => !values[field]?.trim());
}

export function formatMissingContractVariableLabels(
  fields: ContractVariableGapField[],
): string {
  return fields.map((field) => LABELS[field]).join(', ');
}

export function buildContractorFieldsFromPatient(
  patient: ClinicPatient,
): Pick<
  PatientContractEmissionFormValues,
  | 'contractorName'
  | 'contractorBirthDate'
  | 'contractorCpf'
  | 'contractorZip'
  | 'contractorStreet'
  | 'contractorNeighborhood'
  | 'contractorCity'
  | 'contractorState'
> {
  return {
    contractorName: patient.name,
    contractorBirthDate: patient.birthDate,
    contractorCpf: patient.cpf,
    contractorZip: patient.address.zipCode,
    contractorStreet: patient.address.street,
    contractorNeighborhood: patient.address.neighborhood,
    contractorCity: patient.address.city,
    contractorState: patient.address.state,
  };
}
