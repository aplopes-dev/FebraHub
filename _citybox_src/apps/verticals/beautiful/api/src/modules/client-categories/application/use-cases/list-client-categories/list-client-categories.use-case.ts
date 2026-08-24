import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientCategoryEntity } from '../../../domain/entities/client-category.entity';
import { ClientCategoryRepository } from '../../../domain/repositories/client-category.repository.interface';

export interface ListClientCategoriesInput {
  storeId: string;
}

@Injectable()
export class ListClientCategoriesUseCase implements IUseCase<
  ListClientCategoriesInput,
  ClientCategoryEntity[]
> {
  constructor(private readonly repository: ClientCategoryRepository) {}

  async execute(
    input: ListClientCategoriesInput,
  ): Promise<ClientCategoryEntity[]> {
    return this.repository.findAll(input.storeId);
  }
}
