import { ListCardContractsUseCase } from './list-card-contracts.use-case';
import {
  CARD_CONTRACT_ID,
  makeCardContract,
  makeCardContractRepositories,
  ORGANIZATION_ID,
  OTHER_CARD_CONTRACT_ID,
} from '../../../tests/card-contracts-test-factory';

const THIRD_CARD_CONTRACT_ID = 'c4444444-4444-4444-8444-444444444444';

describe('ListCardContractsUseCase', () => {
  async function setup() {
    const repos = makeCardContractRepositories();
    const useCase = new ListCardContractsUseCase(repos.cardContractRepository);

    await repos.cardContractRepository.save(
      makeCardContract({ id: CARD_CONTRACT_ID, provider: 'Cielo' }),
    );
    await repos.cardContractRepository.save(
      makeCardContract({ id: OTHER_CARD_CONTRACT_ID, provider: 'Stone' }),
    );
    await repos.cardContractRepository.save(
      makeCardContract({
        id: THIRD_CARD_CONTRACT_ID,
        provider: 'Rede',
      }).softDelete(),
    );

    return { ...repos, useCase };
  }

  it('devolve só a aba pedida e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((item) => item.contract.provider)).toEqual([
      'Cielo',
      'Stone',
    ]);
    expect(result.total).toBe(2);
    expect(result.tabCounts).toEqual({ active: 2, deleted: 1 });
  });

  it('traz os excluídos sozinhos na aba deleted', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.contract.provider)).toEqual([
      'Rede',
    ]);
    expect(result.tabCounts).toEqual({ active: 2, deleted: 1 });
  });

  it('busca por operadora sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'sto',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].contract.provider).toBe('Stone');
    expect(result.tabCounts).toEqual({ active: 2, deleted: 1 });
  });

  it('devolve a contagem de formas de pagamento junto do contrato', async () => {
    const { useCase, cardContractRepository } = await setup();
    cardContractRepository.setPaymentMethodCount(CARD_CONTRACT_ID, 3);

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(
      result.items.find((item) => item.contract.id === CARD_CONTRACT_ID)
        ?.paymentMethodCount,
    ).toBe(3);
  });
});
