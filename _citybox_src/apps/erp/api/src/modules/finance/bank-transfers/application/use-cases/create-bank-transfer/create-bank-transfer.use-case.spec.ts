import { CreateBankTransferUseCase } from './create-bank-transfer.use-case';
import { BankAccountNotFoundError } from '../../../../bank-accounts/domain/errors/bank-account-not-found.error';
import { CostCenterNotFoundError } from '../../../../cost-centers/domain/errors/cost-center-not-found.error';
import { BankTransferSameAccountError } from '../../../domain/errors/bank-transfer-same-account.error';
import {
  makeBankAccount,
  makeBankTransferRepositories,
  makeCostCenter,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  COST_CENTER_ID,
  ORGANIZATION_ID,
  EFFECTIVE_AT,
  DEFAULT_PAYMENT_METHOD_ID,
} from '../../../tests/bank-transfers-test-factory';

describe('CreateBankTransferUseCase', () => {
  async function setup() {
    const repos = makeBankTransferRepositories();
    await repos.bankAccountRepository.save(
      makeBankAccount({ id: BANK_ACCOUNT_ID, name: 'Conta A' }),
    );
    await repos.bankAccountRepository.save(
      makeBankAccount({ id: OTHER_BANK_ACCOUNT_ID, name: 'Conta B' }),
    );
    await repos.costCenterRepository.save(
      makeCostCenter({ id: COST_CENTER_ID }),
    );

    const useCase = new CreateBankTransferUseCase(
      repos.bankTransferRepository,
      repos.bankAccountRepository,
      repos.costCenterRepository,
      repos.paymentMethodRepository,
    );
    return { ...repos, useCase };
  }

  const baseInput = {
    organizationId: ORGANIZATION_ID,
    fromBankAccountId: BANK_ACCOUNT_ID,
    toBankAccountId: OTHER_BANK_ACCOUNT_ID,
    amountCents: 10_000,
    effectiveAt: EFFECTIVE_AT,
    paymentMethod: DEFAULT_PAYMENT_METHOD_ID,
    costCenterId: COST_CENTER_ID,
    description: 'Cobrir despesas da loja Orla',
  };

  it('cria a transferência e as 2 movimentações vinculadas (débito na origem, crédito no destino)', async () => {
    const { useCase, bankTransactionRepository } = await setup();

    const transfer = await useCase.execute(baseInput);

    const fromBalances =
      await bankTransactionRepository.sumBalancesByAccountIds(ORGANIZATION_ID, [
        BANK_ACCOUNT_ID,
        OTHER_BANK_ACCOUNT_ID,
      ]);
    expect(fromBalances[BANK_ACCOUNT_ID]).toBe(-10_000);
    expect(fromBalances[OTHER_BANK_ACCOUNT_ID]).toBe(10_000);

    const fromMovements = await bankTransactionRepository.findByAccount(
      ORGANIZATION_ID,
      BANK_ACCOUNT_ID,
      {},
    );
    expect(fromMovements[0].sourceType).toBe('bank_transfer');
    expect(fromMovements[0].sourceId).toBe(transfer.id);
  });

  it('recusa quando a conta de origem e a de destino são a mesma (FR-011)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        toBankAccountId: BANK_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(BankTransferSameAccountError);
  });

  it('recusa conta de origem inexistente (FR-013)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        fromBankAccountId: 'b9999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });

  it('recusa conta de destino inexistente (FR-013)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        toBankAccountId: 'b9999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });

  it('recusa centro de custo inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        costCenterId: 'f9999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(CostCenterNotFoundError);
  });
});
