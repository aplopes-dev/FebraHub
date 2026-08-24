import { CreateOperationNatureUseCase } from '../create-operation-nature/create-operation-nature.use-case';
import { GetOperationNatureUseCase } from '../get-operation-nature/get-operation-nature.use-case';
import { DeleteOperationNatureUseCase } from './delete-operation-nature.use-case';
import { OperationNatureNotFoundError } from '../../../domain/errors/operation-nature-not-found.error';
import { InMemoryOperationNatureRepository } from '../../../tests/in-memory-operation-nature.repository';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';

const VALID = {
  organizationId: ORG,
  name: 'Devolução para Fornecedor',
  description: 'Devolução de mercadoria',
  cfopRules: [
    { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' as const },
  ],
  groupRules: [],
};

describe('DeleteOperationNatureUseCase (spec erp/024, Parte A)', () => {
  let repo: InMemoryOperationNatureRepository;
  let create: CreateOperationNatureUseCase;
  let get: GetOperationNatureUseCase;
  let deleteNature: DeleteOperationNatureUseCase;

  beforeEach(() => {
    repo = new InMemoryOperationNatureRepository();
    create = new CreateOperationNatureUseCase(repo);
    get = new GetOperationNatureUseCase(repo);
    deleteNature = new DeleteOperationNatureUseCase(repo);
  });

  it('exclui uma natureza existente (SC-001)', async () => {
    const saved = await create.execute(VALID);

    await deleteNature.execute({ organizationId: ORG, id: saved.id });

    await expect(
      get.execute({ organizationId: ORG, id: saved.id }),
    ).rejects.toThrow(OperationNatureNotFoundError);
  });

  it('lança 404 ao excluir um id inexistente', async () => {
    await expect(
      deleteNature.execute({ organizationId: ORG, id: 'nature-inexistente' }),
    ).rejects.toThrow(OperationNatureNotFoundError);
  });

  it('isola por organização: excluir a natureza de outra organização nunca apaga (cross-tenant, SC-002)', async () => {
    const saved = await create.execute(VALID);

    await expect(
      deleteNature.execute({ organizationId: OTHER_ORG, id: saved.id }),
    ).rejects.toThrow(OperationNatureNotFoundError);

    // A natureza continua existindo intacta para o dono real.
    const stillThere = await get.execute({ organizationId: ORG, id: saved.id });
    expect(stillThere.id).toBe(saved.id);
  });
});
