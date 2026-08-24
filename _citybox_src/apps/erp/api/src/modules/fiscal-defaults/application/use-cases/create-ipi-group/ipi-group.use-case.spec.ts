import { CreateIpiGroupUseCase } from './create-ipi-group.use-case';
import { UpdateIpiGroupUseCase } from '../update-ipi-group/update-ipi-group.use-case';
import { GetFiscalGroupUseCase } from '../get-fiscal-group/get-fiscal-group.use-case';
import { ResolveItemIpiUseCase } from '../resolve-item-ipi/resolve-item-ipi.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';

const ORG = 'org-1';

const VALID = {
  organizationId: ORG,
  name: 'IPI Padrão',
  ipiCst: '50',
  ipiEnquadramento: '999',
  ipiRate: 10,
};

describe('Grupo de IPI use-cases (spec erp/019)', () => {
  let repo: InMemoryFiscalGroupRepository;
  let create: CreateIpiGroupUseCase;
  let update: UpdateIpiGroupUseCase;
  let get: GetFiscalGroupUseCase;
  let resolve: ResolveItemIpiUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalGroupRepository();
    create = new CreateIpiGroupUseCase(repo);
    update = new UpdateIpiGroupUseCase(repo);
    get = new GetFiscalGroupUseCase(repo);
    resolve = new ResolveItemIpiUseCase(repo);
  });

  it('cria e persiste um grupo de IPI tributado (CST 50)', async () => {
    const saved = await create.execute(VALID);
    expect(saved.taxType).toBe('IPI');
    expect(saved.ipiCst).toBe('50');
    expect(saved.ipiEnquadramento).toBe('999');
    expect(saved.ipiRate).toBe(10);

    const reloaded = await get.execute({
      organizationId: ORG,
      id: saved.id,
      taxType: 'IPI',
    });
    expect(reloaded.ipiRate).toBe(10);
  });

  it('recusa CST de entrada (não suportado — v1 só emite saída)', async () => {
    await expect(create.execute({ ...VALID, ipiCst: '00' })).rejects.toThrow();
  });

  it('recusa cEnq fora da tabela versionada', async () => {
    await expect(
      create.execute({ ...VALID, ipiEnquadramento: '888' }),
    ).rejects.toThrow();
  });

  it('exige percentual para CST tributado (50)', async () => {
    await expect(create.execute({ ...VALID, ipiRate: null })).rejects.toThrow();
  });

  it('recusa percentual fora da faixa 0–100', async () => {
    await expect(create.execute({ ...VALID, ipiRate: 150 })).rejects.toThrow();
  });

  it('CST não tributado (53) zera o percentual (não aplicável)', async () => {
    const saved = await create.execute({
      ...VALID,
      ipiCst: '53',
      ipiRate: 10,
    });
    expect(saved.ipiCst).toBe('53');
    expect(saved.ipiRate).toBeNull();
  });

  it('edita o grupo mantendo taxType IPI', async () => {
    const saved = await create.execute(VALID);
    const updated = await update.execute({
      ...VALID,
      id: saved.id,
      name: 'IPI Revisado',
      ipiCst: '99',
      ipiRate: 5,
    });
    expect(updated.name).toBe('IPI Revisado');
    expect(updated.ipiCst).toBe('99');
    expect(updated.ipiRate).toBe(5);
    expect(updated.taxType).toBe('IPI');
  });

  describe('ResolveItemIpi', () => {
    it('resolve item → grupo → CST + cEnq + percentual para a emissão', async () => {
      const saved = await create.execute(VALID);
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIpiGroupId: saved.id,
      });
      expect(resolved).toEqual({ cst: '50', cEnq: '999', aliquota: 10 });
    });

    it('CST não tributado resolve com alíquota null', async () => {
      const saved = await create.execute({
        ...VALID,
        ipiCst: '52',
        ipiRate: null,
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIpiGroupId: saved.id,
      });
      expect(resolved).toEqual({ cst: '52', cEnq: '999', aliquota: null });
    });

    it('item sem grupo → null (emissor NÃO emite bloco IPI — não-regressão)', async () => {
      const resolved = await resolve.execute({
        organizationId: ORG,
        productIpiGroupId: null,
      });
      expect(resolved).toBeNull();
    });

    it('não resolve grupo de outra organização', async () => {
      const saved = await create.execute(VALID);
      const resolved = await resolve.execute({
        organizationId: 'org-2',
        productIpiGroupId: saved.id,
      });
      expect(resolved).toBeNull();
    });
  });
});
