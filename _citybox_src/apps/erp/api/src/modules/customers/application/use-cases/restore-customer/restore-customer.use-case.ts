import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Customer } from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../domain/errors/customer-not-found.error';
import type { RestoreCustomerDto } from '../../dtos/customer.dto';

@Injectable()
export class RestoreCustomerUseCase implements IUseCase<
  RestoreCustomerDto,
  Customer
> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: RestoreCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!customer) throw new CustomerNotFoundError(input.id);
    if (!customer.deletedAt) return customer;
    return this.customerRepository.save(customer.restore());
  }
}
