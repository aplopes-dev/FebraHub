import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientCategoryNotFoundError } from '../../../../client-categories/domain/errors/client-category-not-found.error';
import { ClientCategoryRepository } from '../../../../client-categories/domain/repositories/client-category.repository.interface';
import { ClientEntity } from '../../../domain/entities/client.entity';
import { ClientRepository } from '../../../domain/repositories/client.repository.interface';

export interface CreateClientInput {
  storeId: string;
  name: string;
  phone: string;
  categoryId?: string | null;
}

@Injectable()
export class CreateClientUseCase implements IUseCase<
  CreateClientInput,
  ClientEntity
> {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientCategoryRepository: ClientCategoryRepository,
  ) {}

  async execute(input: CreateClientInput): Promise<ClientEntity> {
    let categoryName: string | null = null;
    let categoryColorId: string | null = null;
    const categoryId = input.categoryId?.trim() || null;

    if (categoryId) {
      const category = await this.clientCategoryRepository.findById(
        input.storeId,
        categoryId,
      );
      if (!category) throw new ClientCategoryNotFoundError(categoryId);
      categoryName = category.name;
      categoryColorId = category.colorId;
    }

    const client = ClientEntity.create({
      storeId: input.storeId,
      name: input.name,
      phone: input.phone,
      categoryId,
      categoryName,
      categoryColorId,
    });

    await this.clientRepository.save(client);
    return client;
  }
}
