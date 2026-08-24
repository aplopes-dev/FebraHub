import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { InMemoryBankAccountRepository } from '../../bank-accounts/tests/in-memory-bank-account.repository';
import { InMemoryBankTransactionRepository } from '../../bank-accounts/tests/in-memory-bank-transaction.repository';
import { makeBankAccount } from '../../bank-accounts/tests/bank-accounts-test-factory';
import {
  makeChartOfAccount,
  makeRepositories as makeChartOfAccountRepositories,
} from '../../chart-of-accounts/tests/chart-of-accounts-test-factory';
import {
  makeCostCenter,
  makeCostCenterRepositories,
} from '../../cost-centers/tests/cost-centers-test-factory';
import {
  makeCustomer,
  makeCustomerRepositories,
} from '../../../customers/tests/customers-test-factory';
import {
  makeSupplier,
  makeRepositories as makeSupplierRepositories,
} from '../../../stock/suppliers/tests/suppliers-test-factory';
import {
  makePaymentMethod,
  makePaymentMethodRepositories,
} from '../../payment-methods/tests/payment-methods-test-factory';
import {
  FinancialEntry,
  type FinancialEntryOperation,
} from '../domain/entities/financial-entry.entity';
import { FinancialEntryAttachment } from '../domain/entities/financial-entry-attachment.entity';
import type { FinancialEntryPaymentInput } from '../domain/entities/financial-entry-payment.entity';
import type { FinancialEntryAllocationInput } from '../domain/entities/financial-entry-allocation.entity';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { InMemoryFinancialEntryRepository } from './in-memory-financial-entry.repository';
import { InMemoryFinancialEntryAttachmentRepository } from './in-memory-financial-entry-attachment.repository';

export {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeBankAccount,
  makeChartOfAccount,
  makeCostCenter,
  makeCustomer,
  makeSupplier,
};

export const FINANCIAL_ENTRY_ID = 'e1111111-1111-4111-8111-111111111111';
export const OTHER_FINANCIAL_ENTRY_ID = 'e2222222-2222-4222-8222-222222222222';

export const COMPETENCE_DATE = new Date('2026-08-01T00:00:00.000Z');
export const DUE_DATE = new Date('2026-08-10T00:00:00.000Z');

/**
 * Placeholders para o rateio default de `makeFinancialEntry` — a entidade só
 * confere que a soma fecha com o total (não a existência da FK), então testes
 * que não olham para `allocations` não precisam semear categoria/centro de
 * custo reais só para ter um lançamento válido em mãos.
 */
const DEFAULT_ALLOCATION_CHART_OF_ACCOUNT_ID =
  'a0000000-0000-4000-8000-000000000000';
const DEFAULT_ALLOCATION_COST_CENTER_ID =
  'f0000000-0000-4000-8000-000000000000';

/**
 * `paymentMethod` passou a ser `PaymentMethod.id` (UUID) — spec
 * `007-financeiro-ajustes-ui` US3. `makeFinancialEntryRepositories` semeia
 * este id no `paymentMethodRepository` de propósito, para que testes que não
 * se importam com qual forma de pagamento (a maioria) não precisem semear a
 * própria.
 */
export const DEFAULT_PAYMENT_METHOD_ID = 'b0000000-0000-4000-8000-000000000000';

export function makeFinancialEntryPayment(
  overrides: Partial<FinancialEntryPaymentInput> = {},
): FinancialEntryPaymentInput {
  return {
    amountCents: overrides.amountCents ?? 10_000,
    paidAt: overrides.paidAt ?? DUE_DATE,
    paymentMethod: overrides.paymentMethod ?? DEFAULT_PAYMENT_METHOD_ID,
    cardBrand: overrides.cardBrand ?? null,
    id: overrides.id,
  };
}

export function makeFinancialEntryAllocation(
  overrides: Partial<FinancialEntryAllocationInput> & {
    chartOfAccountId: string;
    costCenterId: string;
  },
): FinancialEntryAllocationInput {
  return {
    chartOfAccountId: overrides.chartOfAccountId,
    costCenterId: overrides.costCenterId,
    amountCents: overrides.amountCents ?? 10_000,
    percentage: overrides.percentage ?? 100,
    id: overrides.id,
  };
}

export function makeFinancialEntry(
  overrides: Partial<{
    id: string;
    organizationId: string;
    operation: FinancialEntryOperation;
    description: string;
    amountCents: number;
    feesCents: number;
    finesCents: number;
    competenceDate: Date;
    dueDate: Date;
    partyName: string;
    customerId: string | null;
    supplierId: string | null;
    bankAccountId: string | null;
    categoryName: string;
    note: string;
    payments: FinancialEntryPaymentInput[];
    allocations: FinancialEntryAllocationInput[];
  }> = {},
): FinancialEntry {
  const amountCents = overrides.amountCents ?? 10_000;
  const feesCents = overrides.feesCents ?? 0;
  const finesCents = overrides.finesCents ?? 0;
  const defaultAllocations: FinancialEntryAllocationInput[] = [
    makeFinancialEntryAllocation({
      chartOfAccountId: DEFAULT_ALLOCATION_CHART_OF_ACCOUNT_ID,
      costCenterId: DEFAULT_ALLOCATION_COST_CENTER_ID,
      amountCents: amountCents + feesCents + finesCents,
      percentage: 100,
    }),
  ];

  return FinancialEntry.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      operation: overrides.operation ?? 'receivable',
      description: overrides.description ?? 'Venda balcão',
      amountCents,
      feesCents,
      finesCents,
      competenceDate: overrides.competenceDate ?? COMPETENCE_DATE,
      dueDate: overrides.dueDate ?? DUE_DATE,
      partyName: overrides.partyName ?? 'Maria Silva',
      customerId: overrides.customerId ?? null,
      supplierId: overrides.supplierId ?? null,
      bankAccountId: overrides.bankAccountId ?? null,
      categoryName: overrides.categoryName ?? 'Vendas',
      note: overrides.note ?? '',
      payments: overrides.payments ?? [],
      allocations: overrides.allocations ?? defaultAllocations,
    },
    overrides.id ?? FINANCIAL_ENTRY_ID,
  );
}

export function makeFinancialEntryAttachment(
  overrides: Partial<{
    id: string;
    organizationId: string;
    financialEntryId: string;
    fileName: string;
    objectKey: string;
    contentType: string;
    sizeBytes: number;
    createdAt: Date;
  }> = {},
): FinancialEntryAttachment {
  const organizationId = overrides.organizationId ?? ORGANIZATION_ID;
  const financialEntryId = overrides.financialEntryId ?? FINANCIAL_ENTRY_ID;
  return FinancialEntryAttachment.create(
    {
      organizationId,
      financialEntryId,
      fileName: overrides.fileName ?? 'comprovante.pdf',
      objectKey:
        overrides.objectKey ??
        `${organizationId}/financeiro/lancamentos/${financialEntryId}/anexo.pdf`,
      contentType: overrides.contentType ?? 'application/pdf',
      sizeBytes: overrides.sizeBytes ?? 1024,
      createdAt: overrides.createdAt,
    },
    overrides.id,
  );
}

export function makeFinancialEntryRepositories() {
  const {
    accountRepository: chartOfAccountRepository,
    financialGroupRepository,
  } = makeChartOfAccountRepositories();
  const { costCenterRepository } = makeCostCenterRepositories();
  const { customerRepository } = makeCustomerRepositories();
  const { supplierRepository } = makeSupplierRepositories();
  const { paymentMethodRepository } = makePaymentMethodRepositories();
  // Semeada de propósito: a maioria dos testes usa `makeFinancialEntryPayment`
  // sem se importar com qual forma de pagamento, e o use-case agora valida
  // existência real (`assertPaymentMethodExists`) em vez de um enum fixo.
  void paymentMethodRepository.save(
    makePaymentMethod({ id: DEFAULT_PAYMENT_METHOD_ID }),
  );
  // Compartilhada com `bankAccountRepository` — specs que provam o efeito de
  // ledger de um pagamento de lançamento consultam esta mesma instância (ver
  // domain/services/derive-bank-transaction-inputs.ts e research.md D1).
  const bankTransactionRepository = new InMemoryBankTransactionRepository();

  return {
    financialEntryRepository: new InMemoryFinancialEntryRepository(
      bankTransactionRepository,
    ),
    financialEntryAttachmentRepository:
      new InMemoryFinancialEntryAttachmentRepository(),
    objectStorage: new InMemoryObjectStorage(),
    bankAccountRepository: new InMemoryBankAccountRepository(
      bankTransactionRepository,
    ),
    bankTransactionRepository,
    chartOfAccountRepository,
    financialGroupRepository,
    costCenterRepository,
    paymentMethodRepository,
    customerRepository,
    supplierRepository,
  };
}
