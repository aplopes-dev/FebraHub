import { DeleteFiscalGroupUseCase } from './delete-fiscal-group.use-case';
import { GetFiscalDefaultTaxesUseCase } from '../get-fiscal-default-taxes/get-fiscal-default-taxes.use-case';
import { UpsertFiscalDefaultTaxesUseCase } from '../upsert-fiscal-default-taxes/upsert-fiscal-default-taxes.use-case';
import { ListFiscalGroupsUseCase } from '../list-fiscal-groups/list-fiscal-groups.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';
import { InMemoryFiscalDefaultTaxesRepository } from '../../../tests/in-memory-fiscal-default-taxes.repository';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupInUseError } from '../../../domain/errors/fiscal-group-in-use.error';

const ORG = 'org-1';

function makeIcmsGroup(id: string, name = 'ICMS 18%'): FiscalGroup {
  const now = new Date();
  return FiscalGroup.with(
    {
      organizationId: ORG,
      taxType: 'ICMS',
      name,
      pisCst: null,
      pisAliquota: null,
      cofinsCst: null,
      cofinsAliquota: null,
      icmsCst: '00',
      icmsCsosn: null,
      ufRates: [],
      issqnServiceCode: null,
      issqnNationalCode: null,
      issqnRate: null,
      issqnTribType: null,
      ipiCst: null,
      ipiEnquadramento: null,
      ipiRate: null,
      createdAt: now,
      updatedAt: now,
    },
    id,
  );
}

describe('DeleteFiscalGroupUseCase', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let defaultsRepo: InMemoryFiscalDefaultTaxesRepository;
  let deleteGroup: DeleteFiscalGroupUseCase;
  let getDefaults: GetFiscalDefaultTaxesUseCase;
  let upsertDefaults: UpsertFiscalDefaultTaxesUseCase;

  beforeEach(() => {
    groupRepo = new InMemoryFiscalGroupRepository();
    defaultsRepo = new InMemoryFiscalDefaultTaxesRepository();
    deleteGroup = new DeleteFiscalGroupUseCase(groupRepo, defaultsRepo);
    getDefaults = new GetFiscalDefaultTaxesUseCase(defaultsRepo);
    upsertDefaults = new UpsertFiscalDefaultTaxesUseCase(
      defaultsRepo,
      groupRepo,
    );
  });

  it('exclui um grupo sem uso', async () => {
    groupRepo.seed(makeIcmsGroup('icms-1'));

    await deleteGroup.execute({
      organizationId: ORG,
      id: 'icms-1',
      taxType: 'ICMS',
    });

    const list = new ListFiscalGroupsUseCase(groupRepo);
    expect(await list.execute({ organizationId: ORG })).toHaveLength(0);
  });

  it('nega quando o grupo não existe na organização', async () => {
    await expect(
      deleteGroup.execute({ organizationId: ORG, id: 'nope', taxType: 'ICMS' }),
    ).rejects.toBeInstanceOf(FiscalGroupNotFoundError);
  });

  it('nega quando o grupo existe mas é de outro tributo', async () => {
    groupRepo.seed(makeIcmsGroup('icms-1'));

    await expect(
      deleteGroup.execute({
        organizationId: ORG,
        id: 'icms-1',
        taxType: 'IPI',
      }),
    ).rejects.toBeInstanceOf(FiscalGroupNotFoundError);
  });

  it('bloqueia (409/InUse) quando o grupo está vinculado a produtos', async () => {
    groupRepo.seed(makeIcmsGroup('icms-1'));
    groupRepo.seedProductsUsingGroup('icms-1', [
      { productId: 'p1', name: 'Produto 1', sku: 'SKU1' },
    ]);

    await expect(
      deleteGroup.execute({
        organizationId: ORG,
        id: 'icms-1',
        taxType: 'ICMS',
      }),
    ).rejects.toBeInstanceOf(FiscalGroupInUseError);
  });

  it('bloqueia (409/InUse) quando o grupo é o padrão fiscal da organização', async () => {
    groupRepo.seed(makeIcmsGroup('icms-1'));
    // Cria o padrão vazio, depois define icms-1 como padrão.
    await getDefaults.execute({ organizationId: ORG });
    await upsertDefaults.execute({
      organizationId: ORG,
      icmsGroupId: 'icms-1',
      ipiGroupId: null,
      pisCofinsGroupId: null,
      issqnGroupId: null,
      cfop: '5102',
    });

    await expect(
      deleteGroup.execute({
        organizationId: ORG,
        id: 'icms-1',
        taxType: 'ICMS',
      }),
    ).rejects.toBeInstanceOf(FiscalGroupInUseError);
  });

  it('permite excluir um grupo que é padrão de OUTRO tributo diferente do dele', async () => {
    groupRepo.seed(makeIcmsGroup('icms-1'));
    groupRepo.seed(makeIcmsGroup('icms-2', 'ICMS 12%'));
    await getDefaults.execute({ organizationId: ORG });
    await upsertDefaults.execute({
      organizationId: ORG,
      icmsGroupId: 'icms-1',
      ipiGroupId: null,
      pisCofinsGroupId: null,
      issqnGroupId: null,
      cfop: '5102',
    });

    // icms-2 não é o padrão — deve poder ser excluído normalmente.
    await deleteGroup.execute({
      organizationId: ORG,
      id: 'icms-2',
      taxType: 'ICMS',
    });

    const list = new ListFiscalGroupsUseCase(groupRepo);
    const remaining = await list.execute({ organizationId: ORG });
    expect(remaining.map((g) => g.group.id)).toEqual(['icms-1']);
  });
});
