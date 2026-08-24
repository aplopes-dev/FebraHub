import { FindCarrierByIdUseCase } from './find-carrier-by-id.use-case';
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

describe('FindCarrierByIdUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new FindCarrierByIdUseCase(repos.carrierRepository);
    return { ...repos, useCase };
  }

  it('devolve a transportadora da organização ativa', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const carrier = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
    });

    expect(carrier.id).toBe(CARRIER_ID);
  });

  it('devolve a transportadora excluída — a aba "Excluídas" leva até ela', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    const carrier = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
    });

    expect(carrier.deletedAt).not.toBeNull();
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
