import { CreateCardContractUseCase } from './create-card-contract.use-case';
import { CardContractBankAccountNotFoundError } from '../../../domain/errors/card-contract-bank-account-not-found.error';
import {
  BANK_ACCOUNT_ID,
  makeCardContractRepositories,
  ORGANIZATION_ID,
} from '../../../tests/card-contracts-test-factory';

describe('CreateCardContractUseCase', () => {
  function setup() {
    const repos = makeCardContractRepositories();
    const useCase = new CreateCardContractUseCase(
      repos.cardContractRepository,
      repos.bankAccountLookup,
    );
    return { ...repos, useCase };
  }

  it('cria o contrato com a operadora aparada e os defaults da operação', async () => {
    const { useCase } = setup();

    const { contract, paymentMethodCount } = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      provider: '  Cielo  ',
    });

    expect(contract.provider).toBe('Cielo');
    expect(contract.bankAccountId).toBeNull();
    expect(contract.description).toBe('');
    expect(contract.grouping).toBe('no_grouping');
    expect(contract.cutoffPeriod).toBe('daily');
    expect(contract.firstPaymentDayType).toBe('business_days');
    expect(contract.installmentDayType).toBe('business_days');
    expect(contract.anticipationRate).toBe(0);
    expect(contract.active).toBe(true);
    expect(contract.deletedAt).toBeNull();
    expect(paymentMethodCount).toBe(0);
  });

  it('aceita a conta bancária existente na organização', async () => {
    const { useCase, bankAccountLookup } = setup();
    bankAccountLookup.add(ORGANIZATION_ID, BANK_ACCOUNT_ID);

    const { contract } = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      provider: 'Stone',
      bankAccountId: BANK_ACCOUNT_ID,
      anticipationRate: 1.75,
    });

    expect(contract.bankAccountId).toBe(BANK_ACCOUNT_ID);
    expect(contract.anticipationRate).toBe(1.75);
  });

  it('rejeita conta bancária de fora da organização', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        provider: 'Stone',
        bankAccountId: BANK_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(CardContractBankAccountNotFoundError);
  });
});
