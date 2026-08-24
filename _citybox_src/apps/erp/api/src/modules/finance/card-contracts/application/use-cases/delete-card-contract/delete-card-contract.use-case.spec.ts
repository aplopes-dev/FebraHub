import { DeleteCardContractUseCase } from './delete-card-contract.use-case';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import {
  CARD_CONTRACT_ID,
  makeCardContract,
  makeCardContractRepositories,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/card-contracts-test-factory';

describe('DeleteCardContractUseCase', () => {
  function setup() {
    const repos = makeCardContractRepositories();
    const useCase = new DeleteCardContractUseCase(repos.cardContractRepository);
    return { ...repos, useCase };
  }

  it('marca o contrato como excluído sem apagá-lo', async () => {
    const { useCase, cardContractRepository } = setup();
    await cardContractRepository.save(makeCardContract());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARD_CONTRACT_ID,
    });

    const item = await cardContractRepository.findById(
      ORGANIZATION_ID,
      CARD_CONTRACT_ID,
    );
    expect(item?.contract.deletedAt).toBeInstanceOf(Date);
  });

  it('rejeita excluir o mesmo contrato duas vezes', async () => {
    const { useCase, cardContractRepository } = setup();
    await cardContractRepository.save(makeCardContract());
    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARD_CONTRACT_ID,
    });

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CARD_CONTRACT_ID,
      }),
    ).rejects.toBeInstanceOf(CardContractNotFoundError);
  });

  it('não alcança contrato de outra organização', async () => {
    const { useCase, cardContractRepository } = setup();
    await cardContractRepository.save(makeCardContract());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: CARD_CONTRACT_ID,
      }),
    ).rejects.toBeInstanceOf(CardContractNotFoundError);
  });
});
