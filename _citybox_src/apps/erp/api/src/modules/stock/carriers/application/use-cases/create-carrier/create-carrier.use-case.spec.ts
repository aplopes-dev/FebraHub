import { CreateCarrierUseCase } from './create-carrier.use-case';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
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
import {
  CARRIER_CPF,
  CARRIER_DOCUMENT,
  makeCarrier,
  makeRepositories,
} from '../../../tests/carriers-test-factory';

describe('CreateCarrierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateCarrierUseCase(
      repos.carrierRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      personType: 'PJ' as const,
      deliveryType: 'transportadora' as const,
      name: '  Transportadora Pontal  ',
      legalName: 'Transportadora Pontal Ltda',
      document: '11.222.363/0001-98',
      email: 'Contato@Pontal.com.BR',
    };
  }

  it('cria a transportadora com documento só de dígitos e e-mail em minúsculas', async () => {
    const { useCase } = setup();

    const carrier = await useCase.execute(baseInput());

    expect(carrier.name).toBe('Transportadora Pontal');
    expect(carrier.document).toBe('11222363000198');
    expect(carrier.contact.email).toBe('contato@pontal.com.br');
    expect(carrier.stateExempt).toBe(false);
    expect(carrier.icmsExempt).toBe(false);
    expect(carrier.registerInNfe).toBe(false);
    expect(carrier.branchIds).toEqual([]);
    expect(carrier.deletedAt).toBeNull();
  });

  it('vincula as unidades informadas, sem repetir id', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const carrier = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
    });

    expect(carrier.branchIds).toEqual([BRANCH_ID]);
  });

  it('limpa a inscrição estadual quando a transportadora é isenta', async () => {
    const { useCase } = setup();

    const carrier = await useCase.execute({
      ...baseInput(),
      stateExempt: true,
      stateRegistration: '123456',
    });

    expect(carrier.stateExempt).toBe(true);
    expect(carrier.stateRegistration).toBeNull();
  });

  it('aceita registrar o entregador autônomo', async () => {
    const { useCase } = setup();

    const carrier = await useCase.execute({
      ...baseInput(),
      personType: 'PF',
      deliveryType: 'entregador',
      document: CARRIER_CPF,
    });

    expect(carrier.deliveryType).toBe('entregador');
    expect(carrier.personType).toBe('PF');
  });

  it('rejeita documento já usado na organização', async () => {
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier());

    await expect(
      useCase.execute({ ...baseInput(), document: CARRIER_DOCUMENT }),
    ).rejects.toBeInstanceOf(CarrierDocumentTakenError);
  });

  it('aponta a restauração quando o documento é de uma transportadora excluída', async () => {
    // O unique do banco (`organizationId, document`) não conhece soft-delete:
    // se a checagem ignorasse as excluídas, o INSERT estouraria como 500.
    const { useCase, carrierRepository } = setup();
    await carrierRepository.save(makeCarrier().softDelete());

    const error = await useCase
      .execute({ ...baseInput(), document: CARRIER_DOCUMENT })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CarrierDocumentTakenError);
    expect((error as CarrierDocumentTakenError).externalMessage).toMatch(
      /excluída com este CNPJ\/CPF/i,
    );
  });

  it('rejeita CNPJ inválido para pessoa jurídica', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), document: '11.222.333/0001-00' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita CPF no lugar de CNPJ quando o tipo é pessoa jurídica', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), document: CARRIER_CPF }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('aceita CPF quando o tipo é pessoa física', async () => {
    const { useCase } = setup();

    const carrier = await useCase.execute({
      ...baseInput(),
      personType: 'PF',
      document: '529.982.247-25',
    });

    expect(carrier.personType).toBe('PF');
    expect(carrier.document).toBe('52998224725');
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, branchRepository } = setup();
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

  it('rejeita unidade excluída', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch().softDelete());

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
