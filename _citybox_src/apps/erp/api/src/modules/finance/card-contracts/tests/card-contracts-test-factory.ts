import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { CardContract } from '../domain/entities/card-contract.entity';
import { InMemoryCardContractRepository } from './in-memory-card-contract.repository';
import { InMemoryCardPaymentMethodRepository } from './in-memory-card-payment-method.repository';
import { InMemoryBankAccountLookup } from './in-memory-bank-account-lookup';

export { ORGANIZATION_ID, OTHER_ORGANIZATION_ID };

export const CARD_CONTRACT_ID = 'c1111111-1111-4111-8111-111111111111';
export const OTHER_CARD_CONTRACT_ID = 'c2222222-2222-4222-8222-222222222222';
export const BANK_ACCOUNT_ID = 'b3333333-3333-4333-8333-333333333333';

export function makeCardContract(
  overrides: Partial<{
    id: string;
    organizationId: string;
    provider: string;
    bankAccountId: string | null;
  }> = {},
): CardContract {
  return CardContract.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      provider: overrides.provider ?? 'Cielo',
      bankAccountId: overrides.bankAccountId ?? null,
    },
    overrides.id ?? CARD_CONTRACT_ID,
  );
}

export function makeCardContractRepositories() {
  return {
    cardContractRepository: new InMemoryCardContractRepository(),
    paymentMethodRepository: new InMemoryCardPaymentMethodRepository(),
    bankAccountLookup: new InMemoryBankAccountLookup(),
  };
}
