import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContractModelRepository } from '../../../domain/repositories/contract-model.repository.interface';
import type { ContractModel } from '../../../domain/entities/contract-model.entity';
import { ContractModelNotFoundError } from '../../../domain/errors/contract-model-not-found.error';
import { ContractModelNameTakenError } from '../../../domain/errors/contract-model-name-taken.error';
import type { UpdateContractModelDto } from '../../dtos/contract-model.dto';

@Injectable()
export class UpdateContractModelUseCase implements IUseCase<
  UpdateContractModelDto,
  ContractModel
> {
  constructor(
    private readonly contractModelRepository: ContractModelRepository,
  ) {}

  async execute(dto: UpdateContractModelDto): Promise<ContractModel> {
    const model = await this.contractModelRepository.findById(
      dto.storeId,
      dto.id,
    );
    if (!model) {
      throw new ContractModelNotFoundError(
        UpdateContractModelUseCase.name,
        dto.id,
      );
    }

    const name = dto.name.trim();
    if (name.toLowerCase() !== model.name.toLowerCase()) {
      const existing = await this.contractModelRepository.findByName(
        dto.storeId,
        name,
      );
      if (existing && existing.id !== model.id) {
        throw new ContractModelNameTakenError(
          UpdateContractModelUseCase.name,
          name,
        );
      }
    }

    if (dto.isDefault) {
      await this.contractModelRepository.clearDefaultExcept(
        dto.storeId,
        model.id,
      );
    }

    model.update({
      name,
      content: dto.content,
      isDefault: dto.isDefault,
    });

    return this.contractModelRepository.save(model);
  }
}
