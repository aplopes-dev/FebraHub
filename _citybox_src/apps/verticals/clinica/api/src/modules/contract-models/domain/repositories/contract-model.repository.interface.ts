import type { ContractModel } from '../entities/contract-model.entity';

export abstract class ContractModelRepository {
  abstract findById(storeId: string, id: string): Promise<ContractModel | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<ContractModel | null>;
  abstract findAll(storeId: string): Promise<ContractModel[]>;
  abstract clearDefaultExcept(
    storeId: string,
    exceptId?: string,
  ): Promise<void>;
  abstract save(model: ContractModel): Promise<ContractModel>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countEmissions(storeId: string, templateId: string): Promise<number>;
}
