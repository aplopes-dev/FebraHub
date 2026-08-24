import type { PatientContractEmissionFormValues } from '../types/patient-contract-emission';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatContractDate(isoDate: string): string {
  if (!isoDate) {
    return '';
  }

  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatBirthDate(isoDate: string): string {
  if (!isoDate) {
    return '';
  }

  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function buildContractVariableMap(
  values: PatientContractEmissionFormValues,
): Record<string, string> {
  return {
    '{{nome_paciente}}': values.contractorName,
    '{{cpf_contratante}}': values.contractorCpf,
    '{{cidade_contratante}}': values.contractorCity,
    '{{endereco_contratante}}': values.contractorStreet,
    '{{bairro_contratante}}': values.contractorNeighborhood,
    '{{cep_contratante}}': values.contractorZip,
    '{{nome_contratada}}': values.contractedName,
    '{{documento_contratada}}': values.contractedDocument,
    '{{cidade_contratada}}': values.contractedCity,
    '{{descricao_tratamentos}}': values.treatmentsDescription,
    '{{valor_contrato}}': values.contractValue,
    '{{data_contrato}}': formatContractDate(values.contractDate),
    '{{data_nascimento}}': formatBirthDate(values.contractorBirthDate),
    '{{estado_contratante}}': values.contractorState,
  };
}

function replacePlainToken(html: string, token: string, replacement: string): string {
  return html.split(token).join(replacement);
}

function replaceVariableChips(html: string, token: string, replacement: string): string {
  const regex = new RegExp(
    `<span[^>]*data-variable="${escapeRegExp(token)}"[^>]*>[^<]*</span>`,
    'gi',
  );
  return html.replace(regex, replacement);
}

export function interpolateContractVariables(
  html: string,
  values: PatientContractEmissionFormValues,
): string {
  const variableMap = buildContractVariableMap(values);

  return Object.entries(variableMap).reduce((result, [token, replacement]) => {
    const withChips = replaceVariableChips(result, token, replacement);
    return replacePlainToken(withChips, token, replacement);
  }, html);
}
