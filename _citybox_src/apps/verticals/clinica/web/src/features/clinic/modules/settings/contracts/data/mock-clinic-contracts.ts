import type { ClinicContractTemplate } from '../types/clinic-contract';
import type { ClinicContractSheetSuccessPayload } from '../types/clinic-contract-form';

export const MOCK_CLINIC_CONTRACTS: ClinicContractTemplate[] = [
  {
    id: 'contract-001',
    name: 'Contrato de Prestação de Serviços Odontológicos',
    isDefault: true,
    content:
      '<h2>Contrato de Prestação de Serviços Odontológicos</h2>' +
      '<p>Pelo presente instrumento particular, de um lado ' +
      '<span data-variable="{{nome_paciente}}" data-label="Nome Paciente">Nome Paciente</span>, ' +
      'inscrito(a) no CPF sob o nº ' +
      '<span data-variable="{{cpf_contratante}}" data-label="CPF Contratante">CPF Contratante</span>, ' +
      'doravante denominado(a) CONTRATANTE, e de outro lado ' +
      '<span data-variable="{{nome_contratada}}" data-label="Nome Contratada">Nome Contratada</span>, ' +
      'doravante denominada CONTRATADA, têm entre si justo e contratado o seguinte:</p>' +
      '<p>O valor total dos serviços é de ' +
      '<span data-variable="{{valor_contrato}}" data-label="Valor do Contrato">Valor do Contrato</span>, ' +
      'firmado na data de ' +
      '<span data-variable="{{data_contrato}}" data-label="Data do Contrato">Data do Contrato</span>.</p>',
  },
  {
    id: 'contract-002',
    name: 'Termo de Consentimento Informado — Cirurgia',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-003',
    name: 'Contrato de Ortodontia',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-004',
    name: 'Termo de Uso de Imagem e Voz',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-005',
    name: 'Contrato de Estética Facial',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-006',
    name: 'Termo de Consentimento — Procedimentos Injetáveis',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-007',
    name: 'Contrato de Fisioterapia',
    isDefault: false,
    content: '',
  },
  {
    id: 'contract-008',
    name: 'Termo de Responsabilidade — Paciente Menor',
    isDefault: false,
    content: '',
  },
];

export function createClinicContractFromForm(
  input: Pick<ClinicContractSheetSuccessPayload, 'name' | 'isDefault' | 'content'>,
): ClinicContractTemplate {
  return {
    id: `contract-${Date.now()}`,
    name: input.name.trim(),
    isDefault: input.isDefault,
    content: input.content,
  };
}

export function updateClinicContractFromForm(
  template: ClinicContractTemplate,
  input: Pick<ClinicContractSheetSuccessPayload, 'name' | 'isDefault' | 'content'>,
): ClinicContractTemplate {
  return {
    ...template,
    name: input.name.trim(),
    isDefault: input.isDefault,
    content: input.content,
  };
}
