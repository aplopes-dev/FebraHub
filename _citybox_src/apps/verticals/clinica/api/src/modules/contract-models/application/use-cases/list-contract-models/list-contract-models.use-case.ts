import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../domain/repositories/contract-model.repository.interface';
import type { ContractModel } from '../../../domain/entities/contract-model.entity';
import type { ListContractModelsDto } from '../../dtos/contract-model.dto';

@Injectable()
export class ListContractModelsUseCase implements IUseCase<
  ListContractModelsDto,
  ContractModel[]
> {
  constructor(
    private readonly contractModelRepository: ContractModelRepository,
  ) {}

  async execute({ storeId }: ListContractModelsDto): Promise<ContractModel[]> {
    return this.contractModelRepository.findAll(storeId);
  }
}
