import { RestoreCarrierUseCase } from './restore-carrier.use-case';
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

describe('RestoreCarrierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new RestoreCarrierUseCase(repos.carrierRepository);
    return { ...repos, useCase };
  }

  it('devolve a transportadora às abas ativas', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
    });

    expect(restored.deletedAt).toBeNull();
    const stored = await carrierRepository.findById(
      ORGANIZATION_ID,
      CARRIER_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('é idempotente para transportadora já ativa', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
    });

    expect(restored.deletedAt).toBeNull();
  });

  it('responde 404 para transportadora de outra organização', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: CARRIER_ID,
      }),
    ).rejects.toBeInstanceOf(CarrierNotFoundError);
  });
});
