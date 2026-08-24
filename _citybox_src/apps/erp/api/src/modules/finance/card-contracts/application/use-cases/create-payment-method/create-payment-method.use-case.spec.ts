import { CreatePaymentMethodUseCase } from './create-payment-method.use-case';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import { CardRateTierInvalidError } from '../../../domain/errors/card-rate-tier-invalid.error';
import { CardRateTiersOverlapError } from '../../../domain/errors/card-rate-tiers-overlap.error';
import {
  CARD_CONTRACT_ID,
  makeCardContract,
  makeCardContractRepositories,
  ORGANIZATION_ID,
  OTHER_CARD_CONTRACT_ID,
} from '../../../tests/card-contracts-test-factory';

describe('CreatePaymentMethodUseCase', () => {
  async function setup() {
    const repos = makeCardContractRepositories();
    const useCase = new CreatePaymentMethodUseCase(
      repos.cardContractRepository,
      repos.paymentMethodRepository,
    );
    await repos.cardContractRepository.save(makeCardContract());
    return { ...repos, useCase };
  }

  it('cria a forma de pagamento com faixas progressivas válidas', async () => {
    const { useCase } = await setup();

    const method = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      contractId: CARD_CONTRACT_ID,
      type: 'credit',
      brand: 'Visa',
      settlementDays: 30,
      progressiveEnabled: true,
      progressiveTiers: [
        { minInstallments: 1, maxInstallments: 3, rate: 2.5 },
        { minInstallments: 4, maxInstallments: 12, rate: 3.75 },
      ],
    });

    expect(method.type).toBe('credit');
    expect(method.brand).toBe('Visa');
    expect(method.progressiveEnabled).toBe(true);
    expect(method.rateTiers).toHaveLength(2);
    expect(method.rateTiers[0].id).toBeDefined();
    expect(method.rateTiers[1].rate).toBe(3.75);
  });

  it('rejeita faixas sobrepostas', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        contractId: CARD_CONTRACT_ID,
        type: 'credit',
        progressiveEnabled: true,
        progressiveTiers: [
          { minInstallments: 2, maxInstallments: 6, rate: 2.5 },
          { minInstallments: 4, maxInstallments: 12, rate: 3.75 },
        ],
      }),
    ).rejects.toBeInstanceOf(CardRateTiersOverlapError);
  });

  it('rejeita faixa com parcela inicial maior que a final', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        contractId: CARD_CONTRACT_ID,
        type: 'credit',
        progressiveEnabled: true,
        progressiveTiers: [
          { minInstallments: 12, maxInstallments: 6, rate: 2.5 },
        ],
      }),
    ).rejects.toBeInstanceOf(CardRateTierInvalidError);
  });

  it('descarta faixas quando o progressivo está desligado', async () => {
    const { useCase } = await setup();

    const method = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      contractId: CARD_CONTRACT_ID,
      type: 'debit',
      rate: 1.2,
      progressiveEnabled: false,
      progressiveTiers: [{ minInstallments: 1, maxInstallments: 3, rate: 2.5 }],
    });

    expect(method.rateTiers).toHaveLength(0);
    expect(method.rate).toBe(1.2);
  });

  it('não cria forma de pagamento em contrato inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        contractId: OTHER_CARD_CONTRACT_ID,
        type: 'pix',
      }),
    ).rejects.toBeInstanceOf(CardContractNotFoundError);
  });
});
