import type { ContractModel } from '../../../../domain/entities/contract-model.entity';

export type ContractModelResponse = {
  id: string;
  name: string;
  isDefault: boolean;
  content: string;
};

export function toContractModelResponse(
  model: ContractModel,
): ContractModelResponse {
  return {
    id: model.id,
    name: model.name,
    isDefault: model.isDefault,
    content: model.content,
  };
}
