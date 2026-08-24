import type { PatientContractEmissionFormValues } from '../types/patient-contract-emission';
import type { PatientContractEmissionFormErrors } from '../types/patient-contract-emission';

export function validatePatientContractEmissionForm(
  values: PatientContractEmissionFormValues,
): PatientContractEmissionFormErrors {
  const errors: PatientContractEmissionFormErrors = {};

  if (!values.templateId.trim()) {
    errors.templateId = 'Selecione um modelo de contrato.';
  }

  if (!values.contractorName.trim()) {
    errors.contractorName = 'Informe o nome do paciente.';
  }

  if (!values.contractorBirthDate.trim()) {
    errors.contractorBirthDate = 'Informe a data de nascimento.';
  }

  if (!values.contractorCpf.trim()) {
    errors.contractorCpf = 'Informe o CPF.';
  }

  if (!values.contractorZip.trim()) {
    errors.contractorZip = 'Informe o CEP.';
  }

  if (!values.contractorStreet.trim()) {
    errors.contractorStreet = 'Informe a rua.';
  }

  if (!values.contractorNeighborhood.trim()) {
    errors.contractorNeighborhood = 'Informe o bairro.';
  }

  if (!values.contractorCity.trim()) {
    errors.contractorCity = 'Informe a cidade.';
  }

  if (!values.contractorState.trim()) {
    errors.contractorState = 'Informe o estado.';
  }

  if (!values.contractedName.trim()) {
    errors.contractedName = 'Informe o nome da clínica/contratado.';
  }

  if (!values.contractedDocument.trim()) {
    errors.contractedDocument = 'Informe o documento da clínica.';
  }

  if (!values.contractedCity.trim()) {
    errors.contractedCity = 'Informe a cidade da clínica.';
  }

  if (!values.content.trim()) {
    errors.content = 'O conteúdo do contrato não pode estar vazio.';
  }

  return errors;
}

export function hasPatientContractEmissionFormErrors(
  errors: PatientContractEmissionFormErrors,
): boolean {
  return Object.keys(errors).length > 0;
}

export function formatPatientContractEmissionFormErrors(
  errors: PatientContractEmissionFormErrors,
): string {
  return Object.values(errors)
    .filter((message): message is string => Boolean(message?.trim()))
    .join(' ');
}
