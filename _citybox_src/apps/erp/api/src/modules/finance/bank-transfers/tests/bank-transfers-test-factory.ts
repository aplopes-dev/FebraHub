import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
} from '../../bank-accounts/tests/bank-accounts-test-factory';
import {
  makeCostCenter,
  makeCostCenterRepositories,
  COST_CENTER_ID,
} from '../../cost-centers/tests/cost-centers-test-factory';
import {
  makePaymentMethod,
  makePaymentMethodRepositories,
} from '../../payment-methods/tests/payment-methods-test-factory';
import { BankTransfer } from '../domain/entities/bank-transfer.entity';
import { InMemoryBankTransferRepository } from './in-memory-bank-transfer.repository';

export {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeBankAccount,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  makeCostCenter,
  COST_CENTER_ID,
};

export const BANK_TRANSFER_ID = 'b4444444-4444-4444-8444-444444444444';
export const EFFECTIVE_AT = new Date('2026-08-05T00:00:00.000Z');
/** `paymentMethod` é `PaymentMethod.id` (UUID) — spec `007-financeiro-ajustes-ui` US3. */
export const DEFAULT_PAYMENT_METHOD_ID = 'b0000000-0000-4000-8000-000000000000';

export function makeBankTransfer(
  overrides: Partial<{
    id: string;
    organizationId: string;
    fromBankAccountId: string;
    toBankAccountId: string;
    amountCents: number;
    effectiveAt: Date;
    paymentMethod: string;
    costCenterId: string;
    description: string;
  }> = {},
): BankTransfer {
  return BankTransfer.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      fromBankAccountId: overrides.fromBankAccountId ?? BANK_ACCOUNT_ID,
      toBankAccountId: overrides.toBankAccountId ?? OTHER_BANK_ACCOUNT_ID,
      amountCents: overrides.amountCents ?? 10_000,
      effectiveAt: overrides.effectiveAt ?? EFFECTIVE_AT,
      paymentMethod: overrides.paymentMethod ?? DEFAULT_PAYMENT_METHOD_ID,
      costCenterId: overrides.costCenterId ?? COST_CENTER_ID,
      description: overrides.description ?? '',
    },
    overrides.id ?? BANK_TRANSFER_ID,
  );
}

/**
 * Reaproveita `makeBankAccountRepositories()`/`makeCostCenterRepositories()`
 * já existentes — molde de `financial-entries-test-factory.ts`.
 */
export function makeBankTransferRepositories() {
  const { bankAccountRepository, bankTransactionRepository } =
    makeBankAccountRepositories();
  const { costCenterRepository } = makeCostCenterRepositories();
  const { paymentMethodRepository } = makePaymentMethodRepositories();
  // Semeada de propósito — ver o mesmo raciocínio em
  // `financial-entries-test-factory.ts` (`DEFAULT_PAYMENT_METHOD_ID`).
  void paymentMethodRepository.save(
    makePaymentMethod({ id: DEFAULT_PAYMENT_METHOD_ID }),
  );

  return {
    bankTransferRepository: new InMemoryBankTransferRepository(
      bankTransactionRepository,
    ),
    bankAccountRepository,
    bankTransactionRepository,
    costCenterRepository,
    paymentMethodRepository,
  };
}
