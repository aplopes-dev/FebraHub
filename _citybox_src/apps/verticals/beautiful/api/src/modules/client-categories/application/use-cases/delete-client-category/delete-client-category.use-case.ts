import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientCategoryNotFoundError } from '../../../domain/errors/client-category-not-found.error';
import { ClientCategoryProtectedError } from '../../../domain/errors/client-category-protected.error';
import { ClientCategoryRepository } from '../../../domain/repositories/client-category.repository.interface';

export interface DeleteClientCategoryInput {
  storeId: string;
  id: string;
}

@Injectable()
export class DeleteClientCategoryUseCase implements IUseCase<
  DeleteClientCategoryInput,
  void
> {
  constructor(private readonly repository: ClientCategoryRepository) {}

  async execute(input: DeleteClientCategoryInput): Promise<void> {
    const category = await this.repository.findById(input.storeId, input.id);
    if (!category) throw new ClientCategoryNotFoundError(input.id);
    if (category.isProtected) {
      throw new ClientCategoryProtectedError(input.id);
    }
    await this.repository.delete(input.storeId, input.id);
  }
}
