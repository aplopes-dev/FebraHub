import { UpdateCarrierUseCase } from './update-carrier.use-case';
import { BranchNotFoundError } from '../../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import { CarrierDocumentTakenError } from '../../../domain/errors/carrier-document-taken.error';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import {
  CARRIER_DOCUMENT,
  CARRIER_ID,
  makeCarrier,
  makeRepositories,
  OTHER_CARRIER_ID,
} from '../../../tests/carriers-test-factory';

describe('UpdateCarrierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateCarrierUseCase(
      repos.carrierRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      id: CARRIER_ID,
      personType: 'PJ' as const,
      deliveryType: 'transportadora' as const,
      name: 'Transportadora Bahia',
      legalName: 'Transportadora Bahia de Cargas Ltda',
      document: CARRIER_DOCUMENT,
    };
  }

  it('limpa o campo omitido — semântica de PUT', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const updated = await useCase.execute(baseInput());

    expect(updated.contact.email).toBeNull();
    expect(updated.address.city).toBeNull();
    expect(updated.icmsExempt).toBe(false);
    expect(updated.registerInNfe).toBe(false);
  });

  it('aceita corrigir o documento da transportadora', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const updated = await useCase.execute({
      ...baseInput(),
      document: '11.222.363/0001-98',
    });

    expect(updated.document).toBe('11222363000198');
  });

  it('rejeita documento que já pertence a outra transportadora', async () => {
    const { useCase, carrierRepository } = setup();
    const other = makeCnpj(21);
    await carrierRepository.save(makeCarrier());
    await carrierRepository.save(
      makeCarrier({
        id: OTHER_CARRIER_ID,
        name: 'Maria Entregas',
        document: other,
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), document: other }),
    ).rejects.toBeInstanceOf(CarrierDocumentTakenError);
  });

  it('aceita reenviar o próprio documento', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const updated = await useCase.execute({
      ...baseInput(),
      name: 'Transportadora Bahia Sul',
    });

    expect(updated.name).toBe('Transportadora Bahia Sul');
    expect(updated.document).toBe(CARRIER_DOCUMENT);
  });

  it('troca o tipo de entrega', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    const updated = await useCase.execute({
      ...baseInput(),
      deliveryType: 'entregador',
    });

    expect(updated.deliveryType).toBe('entregador');
  });

  it('troca as unidades atendidas', async () => {
    const { useCase, carrierRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await carrierRepository.save(makeCarrier({ branchIds: [] }));

    const updated = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID],
    });

    expect(updated.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, carrierRepository, branchRepository } = setup();
    await carrierRepository.save(makeCarrier());
    await branchRepository.save(
      makeBranch({
        id: OTHER_BRANCH_ID,
        organizationId: OTHER_ORGANIZATION_ID,
        document: makeCnpj(22),
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [OTHER_BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('responde 404 para transportadora excluída', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      CarrierNotFoundError,
    );
  });
});
