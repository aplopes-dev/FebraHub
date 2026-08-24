import { InMemoryStoreSetupRepository } from '../../../tests/in-memory-store-setup.repository';
import { ERP_SEED_TEMPLATE } from '../../seed-data/erp-seed-template';
import { ProvisionOrganizationDataUseCase } from './provision-organization-data.use-case';

const ORGANIZATION_ID = 'org-1';

function setup() {
  const repository = new InMemoryStoreSetupRepository();
  repository.branchIdsByOrganization.set(ORGANIZATION_ID, [
    'branch-1',
    'branch-2',
  ]);
  const useCase = new ProvisionOrganizationDataUseCase(repository);
  return { repository, useCase };
}

describe('ProvisionOrganizationDataUseCase', () => {
  it('provisiona todos os blocos do template numa organização nova', async () => {
    const { repository, useCase } = setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result).toEqual({
      organizationId: ORGANIZATION_ID,
      provisioned: true,
      version: ERP_SEED_TEMPLATE.version,
    });
    expect(repository.permissionProfiles.size).toBe(
      ERP_SEED_TEMPLATE.permissionProfiles.length,
    );
    expect(repository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length,
    );
    expect(repository.unitsOfMeasure.size).toBe(
      ERP_SEED_TEMPLATE.unitsOfMeasure.length,
    );
    expect(repository.productCategories.size).toBe(
      ERP_SEED_TEMPLATE.productCategories.length,
    );
    expect(repository.stocks.size).toBe(ERP_SEED_TEMPLATE.stocks.length);
    expect(repository.financialGroups.size).toBe(
      ERP_SEED_TEMPLATE.financialGroups.length,
    );
    expect(repository.chartOfAccounts.size).toBe(
      ERP_SEED_TEMPLATE.chartOfAccounts.length,
    );
    expect(repository.costCenters.size).toBe(
      ERP_SEED_TEMPLATE.costCenters.length,
    );
    expect(repository.paymentMethods.size).toBe(
      ERP_SEED_TEMPLATE.paymentMethods.length,
    );
    expect(repository.serviceOrderStatuses.size).toBe(
      ERP_SEED_TEMPLATE.serviceOrderStatuses.length,
    );
    expect(repository.contractStatuses.size).toBe(
      ERP_SEED_TEMPLATE.contractStatuses.length,
    );
  });

  it('registra a versão aplicada para não repetir o trabalho', async () => {
    const { repository, useCase } = setup();

    await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(repository.appliedVersions.get(ORGANIZATION_ID)).toBe(
      ERP_SEED_TEMPLATE.version,
    );
  });

  it('não reexecuta quando a organização já está na versão do template', async () => {
    const { repository, useCase } = setup();
    repository.appliedVersions.set(ORGANIZATION_ID, ERP_SEED_TEMPLATE.version);

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.provisioned).toBe(false);
    expect(repository.movementCategories.size).toBe(0);
  });

  it('reexecuta quando o template evoluiu para uma versão maior', async () => {
    const { repository, useCase } = setup();
    repository.appliedVersions.set(
      ORGANIZATION_ID,
      ERP_SEED_TEMPLATE.version - 1,
    );

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.provisioned).toBe(true);
    expect(repository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length,
    );
  });

  it('reexecuta sob demanda mesmo já estando na versão corrente', async () => {
    const { repository, useCase } = setup();
    repository.appliedVersions.set(ORGANIZATION_ID, ERP_SEED_TEMPLATE.version);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      force: true,
    });

    expect(result.provisioned).toBe(true);
    expect(repository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length,
    );
  });

  it('é idempotente: rodar duas vezes não duplica nem sobrescreve o que foi renomeado', async () => {
    const { repository, useCase } = setup();

    await useCase.execute({ organizationId: ORGANIZATION_ID });
    const renamedKey = `${ORGANIZATION_ID}:venda`;
    const renamed = repository.movementCategories.get(renamedKey);
    repository.movementCategories.set(renamedKey, {
      ...renamed!,
      name: 'Saída por venda',
    });

    await useCase.execute({ organizationId: ORGANIZATION_ID, force: true });

    expect(repository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length,
    );
    expect(repository.movementCategories.get(renamedKey)?.name).toBe(
      'Saída por venda',
    );
  });

  it('vincula categorias e depósitos a todas as unidades da organização', async () => {
    const { repository, useCase } = setup();

    await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(
      repository.movementCategoryBranches.has(
        `${ORGANIZATION_ID}:venda:branch-1`,
      ),
    ).toBe(true);
    expect(
      repository.movementCategoryBranches.has(
        `${ORGANIZATION_ID}:venda:branch-2`,
      ),
    ).toBe(true);
    expect(
      repository.stockBranches.has(`${ORGANIZATION_ID}:principal:branch-1`),
    ).toBe(true);
  });

  it('provisiona mesmo sem nenhuma unidade cadastrada', async () => {
    const { repository, useCase } = setup();
    repository.branchIdsByOrganization.set(ORGANIZATION_ID, []);

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.provisioned).toBe(true);
    expect(repository.movementCategoryBranches.size).toBe(0);
  });

  it('mantém organizações isoladas entre si', async () => {
    const { repository, useCase } = setup();
    repository.branchIdsByOrganization.set('org-2', ['branch-9']);

    await useCase.execute({ organizationId: ORGANIZATION_ID });
    await useCase.execute({ organizationId: 'org-2' });

    expect(repository.movementCategories.size).toBe(
      ERP_SEED_TEMPLATE.movementCategories.length * 2,
    );
    expect(repository.appliedVersions.get('org-2')).toBe(
      ERP_SEED_TEMPLATE.version,
    );
  });
});
