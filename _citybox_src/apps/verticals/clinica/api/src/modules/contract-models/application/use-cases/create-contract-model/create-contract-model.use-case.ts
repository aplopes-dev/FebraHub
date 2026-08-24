import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../domain/repositories/contract-model.repository.interface';
import { ContractModel } from '../../../domain/entities/contract-model.entity';
import { ContractModelNameTakenError } from '../../../domain/errors/contract-model-name-taken.error';
import type { CreateContractModelDto } from '../../dtos/contract-model.dto';

@Injectable()
export class CreateContractModelUseCase implements IUseCase<
  CreateContractModelDto,
  ContractModel
> {
  constructor(
    private readonly contractModelRepository: ContractModelRepository,
  ) {}

  async execute(dto: CreateContractModelDto): Promise<ContractModel> {
    const name = dto.name.trim();
    const existing = await this.contractModelRepository.findByName(
      dto.storeId,
      name,
    );
    if (existing) {
      throw new ContractModelNameTakenError(
        CreateContractModelUseCase.name,
        name,
      );
    }

    if (dto.isDefault) {
      await this.contractModelRepository.clearDefaultExcept(dto.storeId);
    }

    const model = ContractModel.create({
      storeId: dto.storeId,
      name,
      content: dto.content,
      isDefault: dto.isDefault,
    });

    return this.contractModelRepository.save(model);
  }
}
