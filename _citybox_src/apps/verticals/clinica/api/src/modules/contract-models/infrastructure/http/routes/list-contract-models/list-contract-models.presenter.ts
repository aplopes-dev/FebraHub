import type { ContractModel } from '../../../../domain/entities/contract-model.entity';
import { toContractModelResponse } from '../shared/contract-model-response.mapper';

export class ListContractModelsPresenter {
  static toHttp(models: ContractModel[]) {
    return {
      data: models.map(toContractModelResponse),
    };
  }
}
