import type { ContractModel } from '../../../../domain/entities/contract-model.entity';
import { toContractModelResponse } from '../shared/contract-model-response.mapper';

export class CreateContractModelPresenter {
  static toHttp(model: ContractModel) {
    return {
      data: toContractModelResponse(model),
    };
  }
}
