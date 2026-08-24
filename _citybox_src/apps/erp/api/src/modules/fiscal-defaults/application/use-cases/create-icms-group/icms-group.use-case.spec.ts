import { CreateIcmsGroupUseCase } from './create-icms-group.use-case';
import { UpdateIcmsGroupUseCase } from '../update-icms-group/update-icms-group.use-case';
import { GetFiscalGroupUseCase } from '../get-fiscal-group/get-fiscal-group.use-case';
import { ResolveItemIcmsUseCase } from '../resolve-item-icms/resolve-item-icms.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';
import { InMemoryFiscalDefaultTaxesRepository } from '../../../tests/in-memory-fiscal-default-taxes.repository';
import { FiscalDefaultTaxes } from '../../../domain/entities/fiscal-default-taxes.entity';

const ORG = 'org-1';
const UF_EMITENTE = 'BA';

function ufRates() {
  return [
    { uf: 'BA', rateType: 'INTERNA' as const, aliquota: 18 },
    { uf: 'SP', rateType: 'INTERESTADUAL' as const, aliquota: 12 },
  ];
}

describe('Grupo de ICMS use-cases (spec erp/016)', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let defaultsRepo: InMemoryFiscalDefaultTaxesRepository;
  let create: CreateIcmsGroupUseCase;
  let update: UpdateIcmsGroupUseCase;
  let get: GetFiscalGroupUseCase;
  let resolve: ResolveItemIcmsUseCase;

  beforeEach(() => {
    groupRepo = new InMemoryFiscalGroupRepository();
    defaultsRepo = new InMemoryFiscalDefaultTaxesRepository();
    create = new CreateIcmsGroupUseCase(groupRepo);
    update = new UpdateIcmsGroupUseCase(groupRepo);
    get = new GetFiscalGroupUseCase(groupRepo);
    resolve = new ResolveItemIcmsUseCase(groupRepo, defaultsRepo);
  });

  it('cria e persiste um grupo de ICMS (CST 00) com alíquotas por UF', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'ICMS 18%',
      icmsCst: '00',
      icmsCsosn: null,
      ufRates: ufRates(),
    });
    expect(saved.taxType).toBe('ICMS');
    expect(saved.icmsCst).toBe('00');
    expect(saved.ufRate('BA', 'INTERNA')).toBe(18);

    const reloaded = await get.execute({ organizationId: ORG, id: saved.id });
    expect(reloaded.ufRate('SP', 'INTERESTADUAL')).toBe(12);
  });

  it('rejeita situação com CST e CSOSN ao mesmo tempo', async () => {
    await expect(
      create.execute({
        organizationId: ORG,
        name: 'Inválido',
        icmsCst: '00',
        icmsCsosn: '102',
        ufRates: [],
      }),
    ).rejects.toThrow();
  });

  it('rejeita CST fora do conjunto suportado', async () => {
    await expect(
      create.execute({
        organizationId: ORG,
        name: 'CST 10',
        icmsCst: '10',
        icmsCsosn: null,
        ufRates: [],
      }),
    ).rejects.toThrow();
  });

  it('aceita CSOSN do Simples (102) sem CST', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Simples',
      icmsCst: null,
      icmsCsosn: '102',
      ufRates: [],
    });
    expect(saved.icmsCsosn).toBe('102');
    expect(saved.icmsCst).toBeNull();
  });

  it('edita um grupo existente substituindo as alíquotas', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Antigo',
      icmsCst: '00',
      icmsCsosn: null,
      ufRates: ufRates(),
    });
    const updated = await update.execute({
      organizationId: ORG,
      id: saved.id,
      name: 'Novo',
      icmsCst: '00',
      icmsCsosn: null,
      ufRates: [{ uf: 'BA', rateType: 'INTERNA', aliquota: 19 }],
    });
    expect(updated.name).toBe('Novo');
    expect(updated.ufRate('BA', 'INTERNA')).toBe(19);
    expect(updated.ufRate('SP', 'INTERESTADUAL')).toBeNull();
  });

  describe('ResolveItemIcms (produto → grupo → padrão → fallback; por UF)', () => {
    it('usa a alíquota interna quando destino = UF do emitente', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Grupo',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: ufRates(),
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIcmsGroupId: group.id,
        destinationUf: 'BA',
        emitterUf: UF_EMITENTE,
      });
      expect(resolved).toEqual({ cst: '00', csosn: null, aliquota: 18 });
    });

    it('usa a alíquota interestadual quando destino ≠ UF do emitente', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Grupo',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: ufRates(),
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIcmsGroupId: group.id,
        destinationUf: 'SP',
        emitterUf: UF_EMITENTE,
      });
      expect(resolved?.aliquota).toBe(12);
    });

    it('herda o grupo padrão da organização quando o produto não tem grupo', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Padrão',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: ufRates(),
      });
      await defaultsRepo.save(
        FiscalDefaultTaxes.with(
          {
            organizationId: ORG,
            icmsGroupId: group.id,
            ipiGroupId: null,
            pisCofinsGroupId: null,
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
        productIcmsGroupId: null,
        destinationUf: 'BA',
        emitterUf: UF_EMITENTE,
      });
      expect(resolved?.aliquota).toBe(18);
    });

    it('retorna null (fallback) sem grupo e sem padrão', async () => {
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIcmsGroupId: null,
        destinationUf: 'SP',
        emitterUf: UF_EMITENTE,
      });
      expect(resolved).toBeNull();
    });

    it('alíquota 0 quando a UF de destino não está na matriz', async () => {
      const group = await create.execute({
        organizationId: ORG,
        name: 'Grupo',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: [{ uf: 'BA', rateType: 'INTERNA', aliquota: 18 }],
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIcmsGroupId: group.id,
        destinationUf: 'RJ',
        emitterUf: UF_EMITENTE,
      });
      expect(resolved?.aliquota).toBe(0);
    });
  });
});
