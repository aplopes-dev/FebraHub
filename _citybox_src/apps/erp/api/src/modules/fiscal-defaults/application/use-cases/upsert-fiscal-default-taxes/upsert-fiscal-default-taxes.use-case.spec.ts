import { ListFiscalGroupsUseCase } from '../list-fiscal-groups/list-fiscal-groups.use-case';
import { GetFiscalDefaultTaxesUseCase } from '../get-fiscal-default-taxes/get-fiscal-default-taxes.use-case';
import { UpsertFiscalDefaultTaxesUseCase } from './upsert-fiscal-default-taxes.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';
import { InMemoryFiscalDefaultTaxesRepository } from '../../../tests/in-memory-fiscal-default-taxes.repository';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';

function makeGroup(
  id: string,
  organizationId: string,
  taxType: 'ICMS' | 'IPI' | 'PIS_COFINS' | 'ISSQN',
  name: string,
): FiscalGroup {
  const now = new Date();
  return FiscalGroup.with(
    {
      organizationId,
      taxType,
      name,
      pisCst: null,
      pisAliquota: null,
      cofinsCst: null,
      cofinsAliquota: null,
      // Grupo de ICMS exige uma situação (CST 00) para passar na validação da entidade.
      icmsCst: taxType === 'ICMS' ? '00' : null,
      icmsCsosn: null,
      ufRates: [],
      // Grupo de ISSQN exige código/cTribNac/exigibilidade válidos (spec erp/018).
      issqnServiceCode: taxType === 'ISSQN' ? '17.02' : null,
      issqnNationalCode: taxType === 'ISSQN' ? '170200' : null,
      issqnRate: null,
      issqnTribType: taxType === 'ISSQN' ? '1' : null,
      // Grupo de IPI exige CST de saída + cEnq válido (spec erp/019).
      ipiCst: taxType === 'IPI' ? '50' : null,
      ipiEnquadramento: taxType === 'IPI' ? '999' : null,
      ipiRate: taxType === 'IPI' ? 10 : null,
      createdAt: now,
      updatedAt: now,
    },
    id,
  );
}

describe('FiscalDefaultTaxes use-cases', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let defaultsRepo: InMemoryFiscalDefaultTaxesRepository;
  let list: ListFiscalGroupsUseCase;
  let get: GetFiscalDefaultTaxesUseCase;
  let upsert: UpsertFiscalDefaultTaxesUseCase;

  beforeEach(() => {
    groupRepo = new InMemoryFiscalGroupRepository();
    defaultsRepo = new InMemoryFiscalDefaultTaxesRepository();
    list = new ListFiscalGroupsUseCase(groupRepo);
    get = new GetFiscalDefaultTaxesUseCase(defaultsRepo);
    upsert = new UpsertFiscalDefaultTaxesUseCase(defaultsRepo, groupRepo);

    groupRepo.seed(makeGroup('icms-1', ORG, 'ICMS', 'ICMS 18%'));
    groupRepo.seed(makeGroup('ipi-1', ORG, 'IPI', 'IPI isento'));
    groupRepo.seed(makeGroup('issqn-1', ORG, 'ISSQN', 'ISS 5%'));
    groupRepo.seed(
      makeGroup('icms-outra', OTHER_ORG, 'ICMS', 'ICMS de outra org'),
    );
  });

  it('lista os grupos da organização filtrando por tributo', async () => {
    const icms = await list.execute({ organizationId: ORG, taxType: 'ICMS' });
    expect(icms.map((g) => g.group.id)).toEqual(['icms-1']);

    const all = await list.execute({ organizationId: ORG });
    expect(all).toHaveLength(3);
    expect(all.every((g) => g.group.organizationId === ORG)).toBe(true);
  });

  it('cria o padrão vazio na primeira leitura (nunca 404)', async () => {
    const defaults = await get.execute({ organizationId: ORG });
    expect(defaults.organizationId).toBe(ORG);
    expect(defaults.icmsGroupId).toBeNull();
    expect(defaults.cfop).toBe('');
  });

  it('persiste o padrão por tributo + cfop', async () => {
    const saved = await upsert.execute({
      organizationId: ORG,
      icmsGroupId: 'icms-1',
      ipiGroupId: 'ipi-1',
      pisCofinsGroupId: null,
      issqnGroupId: 'issqn-1',
      cfop: '5102',
    });
    expect(saved.icmsGroupId).toBe('icms-1');
    expect(saved.ipiGroupId).toBe('ipi-1');
    expect(saved.issqnGroupId).toBe('issqn-1');
    expect(saved.cfop).toBe('5102');

    const reloaded = await get.execute({ organizationId: ORG });
    expect(reloaded.id).toBe(saved.id);
    expect(reloaded.icmsGroupId).toBe('icms-1');
  });

  it('rejeita grupo de tributo errado (grupo de ICMS no slot de IPI)', async () => {
    await expect(
      upsert.execute({
        organizationId: ORG,
        icmsGroupId: null,
        ipiGroupId: 'icms-1', // é ICMS, não IPI
        pisCofinsGroupId: null,
        issqnGroupId: null,
        cfop: '',
      }),
    ).rejects.toThrow();
  });

  it('rejeita grupo de outra organização', async () => {
    await expect(
      upsert.execute({
        organizationId: ORG,
        icmsGroupId: 'icms-outra', // pertence a OTHER_ORG
        ipiGroupId: null,
        pisCofinsGroupId: null,
        issqnGroupId: null,
        cfop: '',
      }),
    ).rejects.toThrow();
  });

  it('normaliza o cfop (trim) ao salvar', async () => {
    const saved = await upsert.execute({
      organizationId: ORG,
      icmsGroupId: null,
      ipiGroupId: null,
      pisCofinsGroupId: null,
      issqnGroupId: null,
      cfop: '  5405  ',
    });
    expect(saved.cfop).toBe('5405');
  });
});
