import { CustomerRepository } from '../../../../customers/domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../../customers/domain/errors/customer-not-found.error';

/**
 * Confere que o cliente vinculado ao lançamento existe, é da organização
 * ativa e não está excluído.
 */
export async function assertCustomerExists(
  customerRepository: CustomerRepository,
  organizationId: string,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;

  const customer = await customerRepository.findById(
    organizationId,
    customerId,
  );
  if (!customer || customer.deletedAt) {
    throw new CustomerNotFoundError(customerId);
  }

  return customerId;
}
