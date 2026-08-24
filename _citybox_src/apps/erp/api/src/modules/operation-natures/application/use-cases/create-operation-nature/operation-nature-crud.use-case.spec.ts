import { CreateOperationNatureUseCase } from './create-operation-nature.use-case';
import { UpdateOperationNatureUseCase } from '../update-operation-nature/update-operation-nature.use-case';
import { GetOperationNatureUseCase } from '../get-operation-nature/get-operation-nature.use-case';
import { ListOperationNaturesUseCase } from '../list-operation-natures/list-operation-natures.use-case';
import { OperationNatureNotFoundError } from '../../../domain/errors/operation-nature-not-found.error';
import { InMemoryOperationNatureRepository } from '../../../tests/in-memory-operation-nature.repository';

const ORG = 'org-1';

const VALID = {
  organizationId: ORG,
  name: 'Devolução para Fornecedor',
  description: 'Devolução de mercadoria',
  cfopRules: [
    { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' as const },
  ],
  groupRules: [],
};

describe('OperationNature CRUD use-cases (spec erp/020)', () => {
  let repo: InMemoryOperationNatureRepository;
  let create: CreateOperationNatureUseCase;
  let update: UpdateOperationNatureUseCase;
  let get: GetOperationNatureUseCase;
  let list: ListOperationNaturesUseCase;

  beforeEach(() => {
    repo = new InMemoryOperationNatureRepository();
    create = new CreateOperationNatureUseCase(repo);
    update = new UpdateOperationNatureUseCase(repo);
    get = new GetOperationNatureUseCase(repo);
    list = new ListOperationNaturesUseCase(repo);
  });

  it('cria, persiste e recarrega (SC-001)', async () => {
    const saved = await create.execute(VALID);
    const reloaded = await get.execute({ organizationId: ORG, id: saved.id });
    expect(reloaded.name).toBe('Devolução para Fornecedor');
    expect(reloaded.cfopRules).toHaveLength(1);
    expect(reloaded.cfopRules[0].toCfop).toBe('5202');
  });

  it('recusa CFOP de origem que não é entrada', async () => {
    await expect(
      create.execute({
        ...VALID,
        cfopRules: [{ fromCfop: '5102', toCfop: '5202', icmsLivre: 'AMBOS' }],
      }),
    ).rejects.toThrow();
  });

  it('lista as naturezas da organização (isola por org)', async () => {
    await create.execute(VALID);
    await create.execute({ ...VALID, organizationId: 'org-2', name: 'Outra' });
    const items = await list.execute({ organizationId: ORG });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Devolução para Fornecedor');
  });

  it('edita mantendo a organização', async () => {
    const saved = await create.execute(VALID);
    const updated = await update.execute({
      ...VALID,
      id: saved.id,
      name: 'Devolução revisada',
      cfopRules: [{ fromCfop: '2102', toCfop: '6202', icmsLivre: 'NAO' }],
    });
    expect(updated.name).toBe('Devolução revisada');
    expect(updated.cfopRules[0].fromCfop).toBe('2102');
  });

  it('editar inexistente lança OperationNatureNotFoundError', async () => {
    await expect(
      update.execute({ ...VALID, id: 'inexistente' }),
    ).rejects.toBeInstanceOf(OperationNatureNotFoundError);
  });

  it('get de outra organização não vaza', async () => {
    const saved = await create.execute(VALID);
    await expect(
      get.execute({ organizationId: 'org-2', id: saved.id }),
    ).rejects.toBeInstanceOf(OperationNatureNotFoundError);
  });
});
