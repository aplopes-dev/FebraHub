import { CreateOrganizationUseCase } from './create-organization.use-case';
import { OrganizationDocumentTakenError } from '../../../domain/errors/organization-document-taken.error';
import { ProvisionOrganizationDataUseCase } from '../../../../store-setup/application/use-cases/provision-organization-data/provision-organization-data.use-case';
import { InMemoryStoreSetupRepository } from '../../../../store-setup/tests/in-memory-store-setup.repository';
import { ERP_SEED_TEMPLATE } from '../../../../store-setup/application/seed-data/erp-seed-template';
import {
  makeOrganization,
  makeRepositories,
  ORGANIZATION_DOCUMENT,
  OWNER_USER_ID,
  RESPONSIBLE_CPF,
} from '../../../tests/tenancy-test-factory';

describe('CreateOrganizationUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const storeSetupRepository = new InMemoryStoreSetupRepository();
    const provisionOrganizationData = new ProvisionOrganizationDataUseCase(
      storeSetupRepository,
    );
    const useCase = new CreateOrganizationUseCase(
      repos.organizationRepository,
      provisionOrganizationData,
    );
    return {
      ...repos,
      storeSetupRepository,
      provisionOrganizationData,
      useCase,
    };
  }

  function baseInput() {
    return {
      actorUserId: OWNER_USER_ID,
      personType: 'PJ' as const,
      document: ORGANIZATION_DOCUMENT,
      legalName: 'Comércio Ilhéus Ltda',
      tradeName: 'Loja Ilhéus',
      email: 'Contato@LojaIlheus.com.br',
      phone: '7332310000',
      responsibleName: 'Maria Souza',
      responsibleDocument: RESPONSIBLE_CPF,
    };
  }

  it('cria a organização e o vínculo de responsável para quem a criou', async () => {
    const { useCase, membershipRepository } = setup();

    const result = await useCase.execute(baseInput());

    expect(result.organization.document).toBe(ORGANIZATION_DOCUMENT);
    expect(result.organization.status).toBe('ACTIVE');
    expect(result.organization.email).toBe('contato@lojailheus.com.br');

    const membership = membershipRepository.memberships.get(
      result.ownerMembershipId,
    );
    expect(membership?.role).toBe('OWNER');
    expect(membership?.userId).toBe(OWNER_USER_ID);
    expect(membership?.active).toBe(true);
  });

  it('rejeita documento já cadastrado em outra organização', async () => {
    const { useCase, organizationRepository } = setup();
    await organizationRepository.save(makeOrganization());

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      OrganizationDocumentTakenError,
    );
  });

  it('normaliza o documento com máscara para apenas dígitos', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      ...baseInput(),
      document: '11.222.333/0001-81',
    });

    expect(result.organization.document).toBe('11222333000181');
  });

  it('provisiona os dados de sistema da organização recém-criada', async () => {
    const { useCase, storeSetupRepository } = setup();

    const result = await useCase.execute(baseInput());

    expect(
      storeSetupRepository.appliedVersions.get(result.organization.id),
    ).toBe(ERP_SEED_TEMPLATE.version);
    expect(storeSetupRepository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length,
    );
  });

  it('entrega a organização mesmo se o provisionamento falhar', async () => {
    const { useCase, provisionOrganizationData } = setup();
    jest
      .spyOn(provisionOrganizationData, 'execute')
      .mockRejectedValueOnce(new Error('banco indisponível'));

    const result = await useCase.execute(baseInput());

    expect(result.organization.document).toBe(ORGANIZATION_DOCUMENT);
  });
});
