import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { PaymentMethod } from '../domain/entities/payment-method.entity';
import { InMemoryPaymentMethodRepository } from './in-memory-payment-method.repository';

export { ORGANIZATION_ID, OTHER_ORGANIZATION_ID };

export const PAYMENT_METHOD_ID = 'a1111111-1111-4111-8111-111111111111';
export const OTHER_PAYMENT_METHOD_ID = 'a2222222-2222-4222-8222-222222222222';

export function makePaymentMethod(
  overrides: Partial<{
    id: string;
    organizationId: string;
    name: string;
    fiscalCode: string | null;
    installmentPermission: string | null;
    systemKey: string | null;
    isSystem: boolean;
  }> = {},
): PaymentMethod {
  return PaymentMethod.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'PIX',
      fiscalCode: overrides.fiscalCode ?? null,
      installmentPermission: overrides.installmentPermission ?? null,
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
    },
    overrides.id ?? PAYMENT_METHOD_ID,
  );
}

export function makePaymentMethodRepositories() {
  return {
    paymentMethodRepository: new InMemoryPaymentMethodRepository(),
  };
}
