import { CreatePisCofinsGroupUseCase } from './create-pis-cofins-group.use-case';
import { UpdatePisCofinsGroupUseCase } from '../update-pis-cofins-group/update-pis-cofins-group.use-case';
import { GetFiscalGroupUseCase } from '../get-fiscal-group/get-fiscal-group.use-case';
import { ResolveItemPisCofinsUseCase } from '../resolve-item-pis-cofins/resolve-item-pis-cofins.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';
import { InMemoryFiscalDefaultTaxesRepository } from '../../../tests/in-memory-fiscal-default-taxes.repository';
import { FiscalDefaultTaxes } from '../../../domain/entities/fiscal-default-taxes.entity';

const ORG = 'org-1';

describe('Grupo de PIS/COFINS use-cases (spec erp/015)', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let defaultsRepo: InMemoryFiscalDefaultTaxesRepository;
  let create: CreatePisCofinsGroupUseCase;
  let update: UpdatePisCofinsGroupUseCase;
  let get: GetFiscalGroupUseCase;
  let resolve: ResolveItemPisCofinsUseCase;

  beforeEach(() => {
    groupRepo = new InMemoryFiscalGroupRepository();
    defaultsRepo = new InMemoryFiscalDefaultTaxesRepository();
    create = new CreatePisCofinsGroupUseCase(groupRepo);
    update = new UpdatePisCofinsGroupUseCase(groupRepo);
    get = new GetFiscalGroupUseCase(groupRepo);
    resolve = new ResolveItemPisCofinsUseCase(groupRepo, defaultsRepo);
  });

  it('cria e persiste um grupo tributado (CST 01) com alíquotas', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Lucro Real padrão',
      pisCst: '01',
      pisAliquota: 1.65,
      cofinsCst: '01',
      cofinsAliquota: 7.6,
    });
    expect(saved.taxType).toBe('PIS_COFINS');
    expect(saved.pisCst).toBe('01');
    expect(saved.pisAliquota).toBe(1.65);

    const reloaded = await get.execute({ organizationId: ORG, id: saved.id });
    expect(reloaded.cofinsAliquota).toBe(7.6);
  });

  it('normaliza CST não tributado (06) descartando a alíquota', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Monofásico',
      pisCst: '06',
      pisAliquota: 1.65, // deve ser descartada
      cofinsCst: '06',
      cofinsAliquota: 7.6,
    });
    expect(saved.pisAliquota).toBeNull();
    expect(saved.cofinsAliquota).toBeNull();
  });

  it('rejeita CST fora do conjunto suportado (03/49)', async () => {
    await expect(
      create.execute({
        organizationId: ORG,
        name: 'Inválido',
        pisCst: '49',
        pisAliquota: null,
        cofinsCst: '49',
        cofinsAliquota: null,
      }),
    ).rejects.toThrow();
  });

  it('rejeita CST tributado sem alíquota', async () => {
    await expect(
      create.execute({
        organizationId: ORG,
        name: 'Sem alíquota',
        pisCst: '01',
        pisAliquota: null,
        cofinsCst: '01',
        cofinsAliquota: null,
      }),
    ).rejects.toThrow();
  });

  it('edita um grupo existente', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Antigo',
      pisCst: '01',
      pisAliquota: 0.65,
      cofinsCst: '01',
      cofinsAliquota: 3,
    });
    const updated = await update.execute({
      organizationId: ORG,
      id: saved.id,
      name: 'Novo',
      pisCst: '02',
      pisAliquota: 1.65,
      cofinsCst: '02',
      cofinsAliquota: 7.6,
    });
    expect(updated.id).toBe(saved.id);
    expect(updated.name).toBe('Novo');
    expect(updated.pisCst).toBe('02');
  });

  describe('ResolveItemPisCofins (produto → grupo → padrão → fallback)', () => {
    it('usa o grupo do próprio produto', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Grupo do produto',
        pisCst: '01',
        pisAliquota: 1.65,
        cofinsCst: '01',
        cofinsAliquota: 7.6,
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        productPisCofinsGroupId: group.id,
      });
      expect(resolved).toEqual({
        pis: { cst: '01', aliquota: 1.65 },
        cofins: { cst: '01', aliquota: 7.6 },
      });
    });

    it('herda o grupo padrão da organização quando o produto não tem grupo', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Padrão da org',
        pisCst: '01',
        pisAliquota: 0.65,
        cofinsCst: '01',
        cofinsAliquota: 3,
      });
      await defaultsRepo.save(
        FiscalDefaultTaxes.with(
          {
            organizationId: ORG,
            icmsGroupId: null,
            ipiGroupId: null,
            pisCofinsGroupId: group.id,
            issqnGroupId: null,
            cfop: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          'defaults-1',
        ),
      );
      const resolved = await resolve.execute({
        organizationId: ORG,
        productPisCofinsGroupId: null,
      });
      expect(resolved?.pis).toEqual({ cst: '01', aliquota: 0.65 });
    });

    it('retorna null (fallback) sem grupo e sem padrão', async () => {
      const resolved = await resolve.execute({
        organizationId: ORG,
        productPisCofinsGroupId: null,
      });
      expect(resolved).toBeNull();
    });
  });
});
