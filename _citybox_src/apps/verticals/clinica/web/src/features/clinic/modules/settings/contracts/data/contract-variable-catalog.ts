import type { ContractVariable, ContractVariableCategory } from '../types/clinic-contract';

export const CONTRACT_VARIABLE_CATEGORY_LABEL: Record<ContractVariableCategory, string> = {
  contracting_party: 'Contratante',
  contracted_party: 'Contratada',
  treatment_costs: 'Procedimento e custos',
  contract_info: 'Informações do contrato',
};

function createVariable(
  id: string,
  label: string,
  token: string,
  category: ContractVariableCategory,
): ContractVariable {
  return { id, label, token, category };
}

export const CONTRACT_VARIABLE_CATALOG: ContractVariable[] = [
  createVariable('var-patient-name', 'Nome Paciente', '{{nome_paciente}}', 'contracting_party'),
  createVariable('var-contractor-cpf', 'CPF Contratante', '{{cpf_contratante}}', 'contracting_party'),
  createVariable(
    'var-contractor-city',
    'Cidade Contratante',
    '{{cidade_contratante}}',
    'contracting_party',
  ),
  createVariable(
    'var-contractor-address',
    'Endereço Contratante',
    '{{endereco_contratante}}',
    'contracting_party',
  ),
  createVariable(
    'var-contractor-district',
    'Bairro Contratante',
    '{{bairro_contratante}}',
    'contracting_party',
  ),
  createVariable('var-contractor-zip', 'CEP Contratante', '{{cep_contratante}}', 'contracting_party'),
  createVariable('var-clinic-name', 'Nome Contratada', '{{nome_contratada}}', 'contracted_party'),
  createVariable(
    'var-clinic-document',
    'CNPJ/CPF Contratada',
    '{{documento_contratada}}',
    'contracted_party',
  ),
  createVariable('var-clinic-city', 'Cidade Contratada', '{{cidade_contratada}}', 'contracted_party'),
  createVariable(
    'var-treatments',
    'Descrição dos Procedimentos',
    '{{descricao_tratamentos}}',
    'treatment_costs',
  ),
  createVariable('var-contract-value', 'Valor do Contrato', '{{valor_contrato}}', 'treatment_costs'),
  createVariable('var-contract-date', 'Data do Contrato', '{{data_contrato}}', 'contract_info'),
];

export function groupContractVariablesByCategory(
  variables: ContractVariable[],
): Array<{ category: ContractVariableCategory; label: string; items: ContractVariable[] }> {
  const categories = Object.keys(CONTRACT_VARIABLE_CATEGORY_LABEL) as ContractVariableCategory[];

  return categories
    .map((category) => ({
      category,
      label: CONTRACT_VARIABLE_CATEGORY_LABEL[category],
      items: variables.filter((variable) => variable.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
