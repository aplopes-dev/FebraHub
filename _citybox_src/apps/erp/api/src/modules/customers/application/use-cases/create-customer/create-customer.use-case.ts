import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { assertBranchesBelongToOrganization } from '../../../../stock/suppliers/application/use-cases/assert-branches-belong-to-organization';
import { CustomerCategoryRepository } from '../../../customer-categories/domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNotFoundError } from '../../../customer-categories/domain/errors/customer-category-not-found.error';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { CustomerDocumentTakenError } from '../../../domain/errors/customer-document-taken.error';
import type { CreateCustomerDto } from '../../dtos/customer.dto';

@Injectable()
export class CreateCustomerUseCase implements IUseCase<
  CreateCustomerDto,
  Customer
> {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly branchRepository: BranchRepository,
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(input: CreateCustomerDto): Promise<Customer> {
    const document = input.document
      ? normalizeDocument(input.document) || null
      : null;

    if (document) {
      const existing = await this.customerRepository.findByDocument(
        input.organizationId,
        document,
      );
      if (existing) {
        throw new CustomerDocumentTakenError(
          document,
          existing.deletedAt !== null,
        );
      }
    }

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(
        input.organizationId,
        input.categoryId,
      );
      if (!category) {
        throw new CustomerCategoryNotFoundError(input.categoryId);
      }
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const customer = Customer.create({
      organizationId: input.organizationId,
      personType: input.personType,
      name: input.name,
      document,
      rg: input.rg,
      birthDate: input.birthDate,
      email: input.email,
      mobilePhone: input.mobilePhone,
      phone: input.phone,
      additionalPhones: input.additionalPhones,
      stage: input.stage,
      categoryId: input.categoryId,
      notes: input.notes,
      addresses: input.addresses,
      branchIds,
    });

    return this.customerRepository.save(customer);
  }
}
