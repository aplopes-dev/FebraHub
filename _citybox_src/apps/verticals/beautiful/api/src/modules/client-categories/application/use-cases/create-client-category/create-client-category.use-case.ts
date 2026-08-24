import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DEFAULT_CATEGORY_HEX } from '../../../../../shared/core/utils/category-hex';
import { ClientCategoryEntity } from '../../../domain/entities/client-category.entity';
import { ClientCategoryDuplicateError } from '../../../domain/errors/client-category-duplicate.error';
import { ClientCategoryRepository } from '../../../domain/repositories/client-category.repository.interface';

export interface CreateClientCategoryInput {
  storeId: string;
  name: string;
  colorId?: string;
}

@Injectable()
export class CreateClientCategoryUseCase implements IUseCase<
  CreateClientCategoryInput,
  ClientCategoryEntity
> {
  constructor(private readonly repository: ClientCategoryRepository) {}

  async execute(
    input: CreateClientCategoryInput,
  ): Promise<ClientCategoryEntity> {
    const name = input.name.trim();
    const existing = await this.repository.findByName(input.storeId, name);
    if (existing) throw new ClientCategoryDuplicateError(name);

    const category = ClientCategoryEntity.create({
      storeId: input.storeId,
      name,
      colorId: input.colorId ?? DEFAULT_CATEGORY_HEX,
    });
    await this.repository.save(category);
    return category;
  }
}
