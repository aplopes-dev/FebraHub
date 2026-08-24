import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { assertBranchesBelongToOrganization } from '../../../../stock/suppliers/application/use-cases/assert-branches-belong-to-organization';
import { CustomerCategoryRepository } from '../../../customer-categories/domain/repositories/customer-category.repository.interface';
import { CustomerCategoryNotFoundError } from '../../../customer-categories/domain/errors/customer-category-not-found.error';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../domain/errors/customer-not-found.error';
import { CustomerDocumentTakenError } from '../../../domain/errors/customer-document-taken.error';
import type { Customer } from '../../../domain/entities/customer.entity';
import type { UpdateCustomerDto } from '../../dtos/customer.dto';

@Injectable()
export class UpdateCustomerUseCase implements IUseCase<
  UpdateCustomerDto,
  Customer
> {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly branchRepository: BranchRepository,
    private readonly categoryRepository: CustomerCategoryRepository,
  ) {}

  async execute(input: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!customer || customer.deletedAt) {
      throw new CustomerNotFoundError(input.id);
    }

    const document = input.document
      ? normalizeDocument(input.document) || null
      : null;

    if (document) {
      const existing = await this.customerRepository.findByDocument(
        input.organizationId,
        document,
      );
      if (existing && existing.id !== customer.id) {
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

    return this.customerRepository.save(
      customer.update({
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
      }),
    );
  }
}
