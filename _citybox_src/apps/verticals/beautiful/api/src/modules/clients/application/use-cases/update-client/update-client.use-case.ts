import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientCategoryNotFoundError } from '../../../../client-categories/domain/errors/client-category-not-found.error';
import { ClientCategoryRepository } from '../../../../client-categories/domain/repositories/client-category.repository.interface';
import { ClientEntity } from '../../../domain/entities/client.entity';
import { ClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

export interface UpdateClientInput {
  storeId: string;
  id: string;
  name?: string;
  phone?: string;
  categoryId?: string | null;
}

@Injectable()
export class UpdateClientUseCase implements IUseCase<
  UpdateClientInput,
  ClientEntity
> {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientCategoryRepository: ClientCategoryRepository,
  ) {}

  async execute(input: UpdateClientInput): Promise<ClientEntity> {
    const client = await this.clientRepository.findById(
      input.storeId,
      input.id,
    );
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    if (input.categoryId !== undefined) {
      const categoryId = input.categoryId?.trim() || null;
      if (categoryId) {
        const category = await this.clientCategoryRepository.findById(
          input.storeId,
          categoryId,
        );
        if (!category) throw new ClientCategoryNotFoundError(categoryId);
        client.update({
          name: input.name,
          phone: input.phone,
          categoryId,
        });
        client.setCategoryName(category.name);
        client.setCategoryColorId(category.colorId);
      } else {
        client.update({
          name: input.name,
          phone: input.phone,
          categoryId: null,
        });
      }
    } else {
      client.update({
        name: input.name,
        phone: input.phone,
      });
    }

    await this.clientRepository.save(client);
    return client;
  }
}
