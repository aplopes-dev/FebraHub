import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Customer } from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../domain/errors/customer-not-found.error';
import type { FindCustomerByIdDto } from '../../dtos/customer.dto';

@Injectable()
export class FindCustomerByIdUseCase implements IUseCase<
  FindCustomerByIdDto,
  Customer
> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: FindCustomerByIdDto): Promise<Customer> {
    const customer = await this.customerRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!customer) throw new CustomerNotFoundError(input.id);
    return customer;
  }
}
