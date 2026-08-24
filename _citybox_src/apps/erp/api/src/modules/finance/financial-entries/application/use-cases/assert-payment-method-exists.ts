import { PaymentMethodRepository } from '../../../payment-methods/domain/repositories/payment-method.repository.interface';
import { PaymentMethodNotFoundError } from '../../../payment-methods/domain/errors/payment-method-not-found.error';

/**
 * Confere que a forma de pagamento informada num pagamento existe, é da
 * organização ativa e não está excluída — spec `007-financeiro-ajustes-ui`
 * US3. Substitui a validação de enum fixo (`@IsIn(FINANCIAL_ENTRY_PAYMENT_METHODS)`)
 * por existência real no cadastro (`research.md` R1).
 */
export async function assertPaymentMethodExists(
  paymentMethodRepository: PaymentMethodRepository,
  organizationId: string,
  paymentMethodId: string,
): Promise<string> {
  const paymentMethod = await paymentMethodRepository.findById(
    organizationId,
    paymentMethodId,
  );
  if (!paymentMethod || paymentMethod.deletedAt) {
    throw new PaymentMethodNotFoundError(paymentMethodId);
  }

  return paymentMethodId;
}
