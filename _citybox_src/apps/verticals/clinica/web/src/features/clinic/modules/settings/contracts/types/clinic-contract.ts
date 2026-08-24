export type ClinicContractTemplate = {
  id: string;
  name: string;
  isDefault: boolean;
  content: string;
};

export type ContractVariableCategory =
  | 'contracting_party'
  | 'contracted_party'
  | 'treatment_costs'
  | 'contract_info';

export type ContractVariable = {
  id: string;
  label: string;
  token: string;
  category: ContractVariableCategory;
};

export const CONTRACT_VARIABLE_DRAG_MIME = 'application/x-citybox-contract-variable';
