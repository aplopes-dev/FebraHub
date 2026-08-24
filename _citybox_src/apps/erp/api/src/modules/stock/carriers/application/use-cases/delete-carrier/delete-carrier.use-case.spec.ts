import { DeleteCarrierUseCase } from './delete-carrier.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import {
  CARRIER_ID,
  makeCarrier,
  makeRepositories,
} from '../../../tests/carriers-test-factory';

describe('DeleteCarrierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteCarrierUseCase(repos.carrierRepository);
    return { ...repos, useCase };
  }

  it('marca a transportadora como excluída sem apagá-la', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
    });

    const stored = await carrierRepository.findById(
      ORGANIZATION_ID,
      CARRIER_ID,
    );
    expect(stored?.deletedAt).toBeInstanceOf(Date);
  });

  it('responde 404 ao excluir duas vezes', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: CARRIER_ID }),
    ).rejects.toBeInstanceOf(CarrierNotFoundError);
  });

  it('responde 404 para transportadora de outra organização', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: CARRIER_ID,
      }),
    ).rejects.toBeInstanceOf(CarrierNotFoundError);
  });
});
