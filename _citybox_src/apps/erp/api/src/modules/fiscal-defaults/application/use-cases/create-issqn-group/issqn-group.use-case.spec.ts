import { CreateIssqnGroupUseCase } from './create-issqn-group.use-case';
import { UpdateIssqnGroupUseCase } from '../update-issqn-group/update-issqn-group.use-case';
import { GetFiscalGroupUseCase } from '../get-fiscal-group/get-fiscal-group.use-case';
import { ResolveServiceIssqnUseCase } from '../resolve-service-issqn/resolve-service-issqn.use-case';
import { InMemoryFiscalGroupRepository } from '../../../tests/in-memory-fiscal-group.repository';

const ORG = 'org-1';

const VALID = {
  organizationId: ORG,
  name: 'Serviço de TI',
  issqnServiceCode: '01.07',
  issqnNationalCode: '010700',
  issqnRate: 5,
  issqnTribType: '1',
};

describe('Grupo de ISSQN use-cases (spec erp/018)', () => {
  let repo: InMemoryFiscalGroupRepository;
  let create: CreateIssqnGroupUseCase;
  let update: UpdateIssqnGroupUseCase;
  let get: GetFiscalGroupUseCase;
  let resolve: ResolveServiceIssqnUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalGroupRepository();
    create = new CreateIssqnGroupUseCase(repo);
    update = new UpdateIssqnGroupUseCase(repo);
    get = new GetFiscalGroupUseCase(repo);
    resolve = new ResolveServiceIssqnUseCase(repo);
  });

  it('cria e persiste um grupo de ISSQN', async () => {
    const saved = await create.execute(VALID);
    expect(saved.taxType).toBe('ISSQN');
    expect(saved.issqnServiceCode).toBe('01.07');
    expect(saved.issqnNationalCode).toBe('010700');
    expect(saved.issqnTribType).toBe('1');

    const reloaded = await get.execute({
      organizationId: ORG,
      id: saved.id,
      taxType: 'ISSQN',
    });
    expect(reloaded.issqnRate).toBe(5);
  });

  it('recusa código municipal fora do formato NN.NN', async () => {
    await expect(
      create.execute({ ...VALID, issqnServiceCode: '107' }),
    ).rejects.toThrow();
  });

  it('recusa cTribNac que não tenha 6 dígitos', async () => {
    await expect(
      create.execute({ ...VALID, issqnNationalCode: '0107' }),
    ).rejects.toThrow();
  });

  it('recusa exigibilidade não suportada (ex.: 3 exportação)', async () => {
    await expect(
      create.execute({ ...VALID, issqnTribType: '3' }),
    ).rejects.toThrow();
  });

  it('aceita alíquota nula (só transmitida com retenção)', async () => {
    const saved = await create.execute({ ...VALID, issqnRate: null });
    expect(saved.issqnRate).toBeNull();
  });

  it('edita o grupo mantendo taxType ISSQN', async () => {
    const saved = await create.execute(VALID);
    const updated = await update.execute({
      ...VALID,
      id: saved.id,
      name: 'Consultoria',
      issqnTribType: '2',
    });
    expect(updated.name).toBe('Consultoria');
    expect(updated.issqnTribType).toBe('2');
    expect(updated.taxType).toBe('ISSQN');
  });

  describe('ResolveServiceIssqn', () => {
    it('resolve item → grupo → valores prontos para a emissão', async () => {
      const saved = await create.execute(VALID);
      const resolved = await resolve.execute({
        organizationId: ORG,
        issqnGroupId: saved.id,
      });
      expect(resolved).toEqual({
        municipalServiceCode: '01.07',
        nationalServiceCode: '010700',
        issRate: 5,
        tribISSQN: '1',
      });
    });

    it('item sem grupo → null (tela exige escolha explícita)', async () => {
      const resolved = await resolve.execute({
        organizationId: ORG,
        issqnGroupId: null,
      });
      expect(resolved).toBeNull();
    });

    it('não resolve grupo de outro tributo', async () => {
      const saved = await create.execute(VALID);
      // Um grupo de outra org não deve vazar.
      const resolved = await resolve.execute({
        organizationId: 'org-2',
        issqnGroupId: saved.id,
      });
      expect(resolved).toBeNull();
    });
  });
});
