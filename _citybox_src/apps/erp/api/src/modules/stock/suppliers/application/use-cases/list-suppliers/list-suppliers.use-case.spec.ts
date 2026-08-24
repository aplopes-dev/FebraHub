import { ListSuppliersUseCase } from './list-suppliers.use-case';
import {
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import {
  makeRepositories,
  makeSupplier,
  OTHER_SUPPLIER_ID,
  SUPPLIER_ID,
} from '../../../tests/suppliers-test-factory';

describe('ListSuppliersUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListSuppliersUseCase(repos.supplierRepository);

    await repos.supplierRepository.save(
      makeSupplier({ id: SUPPLIER_ID, name: 'Distribuidora Bahia' }),
    );
    await repos.supplierRepository.save(
      makeSupplier({
        id: OTHER_SUPPLIER_ID,
        name: 'Maria Hortifruti',
        document: makeCnpj(11),
      }).softDelete(),
    );

    return { ...repos, useCase };
  }

  it('lista só os ativos por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((s) => s.id)).toEqual([SUPPLIER_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('lista só os excluídos na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((s) => s.id)).toEqual([OTHER_SUPPLIER_ID]);
    expect(result.total).toBe(1);
  });

  it('filtra pela busca sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'bahia',
    });

    expect(result.items.map((s) => s.name)).toEqual(['Distribuidora Bahia']);
    expect(result.total).toBe(1);
    // Os contadores dizem quanto existe em cada aba, não quanto a busca achou.
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('não devolve fornecedor de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });

  it('normaliza a página pedida contra o total real', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      page: 99,
      perPage: 10,
    });

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
