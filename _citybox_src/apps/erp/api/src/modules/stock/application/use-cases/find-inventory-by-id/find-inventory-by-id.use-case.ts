import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InventoryNotFoundError } from '../../../domain/errors/inventory-not-found.error';
import { InventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import type {
  FindInventoryByIdDto,
  FindInventoryByIdResult,
} from '../../dtos/inventory.dto';

@Injectable()
export class FindInventoryByIdUseCase implements IUseCase<
  FindInventoryByIdDto,
  FindInventoryByIdResult
> {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(input: FindInventoryByIdDto): Promise<FindInventoryByIdResult> {
    const detail = await this.inventoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail) throw new InventoryNotFoundError(input.id);
    return detail;
  }
}
