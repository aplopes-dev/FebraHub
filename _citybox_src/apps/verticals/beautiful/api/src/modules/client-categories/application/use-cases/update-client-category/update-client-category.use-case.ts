import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientCategoryEntity } from '../../../domain/entities/client-category.entity';
import { ClientCategoryDuplicateError } from '../../../domain/errors/client-category-duplicate.error';
import { ClientCategoryNotFoundError } from '../../../domain/errors/client-category-not-found.error';
import { ClientCategoryRepository } from '../../../domain/repositories/client-category.repository.interface';

export interface UpdateClientCategoryInput {
  storeId: string;
  id: string;
  name: string;
  colorId?: string;
}

@Injectable()
export class UpdateClientCategoryUseCase implements IUseCase<
  UpdateClientCategoryInput,
  ClientCategoryEntity
> {
  constructor(private readonly repository: ClientCategoryRepository) {}

  async execute(
    input: UpdateClientCategoryInput,
  ): Promise<ClientCategoryEntity> {
    const category = await this.repository.findById(input.storeId, input.id);
    if (!category) throw new ClientCategoryNotFoundError(input.id);

    const name = input.name.trim();
    const duplicate = await this.repository.findByName(input.storeId, name);
    if (duplicate && duplicate.id !== category.id) {
      throw new ClientCategoryDuplicateError(name);
    }

    category.update({
      name,
      ...(input.colorId !== undefined ? { colorId: input.colorId } : {}),
    });
    await this.repository.save(category);
    return category;
  }
}
