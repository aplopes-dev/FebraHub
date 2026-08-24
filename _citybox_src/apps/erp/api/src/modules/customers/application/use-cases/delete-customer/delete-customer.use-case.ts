import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../domain/errors/customer-not-found.error';
import type { DeleteCustomerDto } from '../../dtos/customer.dto';

@Injectable()
export class DeleteCustomerUseCase implements IUseCase<
  DeleteCustomerDto,
  void
> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: DeleteCustomerDto): Promise<void> {
    const customer = await this.customerRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!customer || customer.deletedAt) {
      throw new CustomerNotFoundError(input.id);
    }
    await this.customerRepository.save(customer.softDelete());
  }
}
