import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CustomerCategoryRepository } from '../../../domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNotFoundError } from '../../../domain/errors/customer-category-not-found.error';
import { CustomerCategoryInUseError } from '../../../domain/errors/customer-category-in-use.error';
import type { DeleteCustomerCategoryDto } from '../../dtos/customer-category.dto';

@Injectable()
export class DeleteCustomerCategoryUseCase implements IUseCase<
  DeleteCustomerCategoryDto,
  void
> {
  constructor(
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute({
    organizationId,
    id,
  }: DeleteCustomerCategoryDto): Promise<void> {
    const category = await this.categoryRepository.findById(organizationId, id);
    if (!category) throw new CustomerCategoryNotFoundError(id);

    const customerCount = await this.categoryRepository.countCustomers(
      organizationId,
      id,
    );
    if (customerCount > 0) {
      throw new CustomerCategoryInUseError(category.name, customerCount);
    }

    await this.categoryRepository.delete(organizationId, id);
  }
}
