import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../domain/repositories/contract-model.repository.interface';
import { ContractModelNotFoundError } from '../../../domain/errors/contract-model-not-found.error';
import { ContractModelIsDefaultError } from '../../../domain/errors/contract-model-is-default.error';
import { ContractModelHasPatientsError } from '../../../domain/errors/contract-model-has-patients.error';
import type { DeleteContractModelDto } from '../../dtos/contract-model.dto';

@Injectable()
export class DeleteContractModelUseCase implements IUseCase<
  DeleteContractModelDto,
  void
> {
  constructor(
    private readonly contractModelRepository: ContractModelRepository,
  ) {}

  async execute({ storeId, id }: DeleteContractModelDto): Promise<void> {
    const model = await this.contractModelRepository.findById(storeId, id);
    if (!model) {
      throw new ContractModelNotFoundError(DeleteContractModelUseCase.name, id);
    }

    if (model.isDefault) {
      throw new ContractModelIsDefaultError(
        DeleteContractModelUseCase.name,
        id,
      );
    }

    const emissions = await this.contractModelRepository.countEmissions(
      storeId,
      id,
    );
    if (emissions > 0) {
      throw new ContractModelHasPatientsError(
        DeleteContractModelUseCase.name,
        id,
      );
    }

    await this.contractModelRepository.delete(storeId, id);
  }
}
