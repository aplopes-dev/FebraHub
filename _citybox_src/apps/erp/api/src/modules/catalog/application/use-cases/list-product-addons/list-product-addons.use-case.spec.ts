import { ListProductAddonsUseCase } from './list-product-addons.use-case';
import {
  makeAddon,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('ListProductAddonsUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new ListProductAddonsUseCase(repos.addonRepository);
    return { ...repos, useCase };
  }

  it('sem paginação, devolve só os ativos por padrão', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(
      makeAddon({ id: '77777777-7777-4777-8777-777777777771', name: 'Bacon' }),
    );
    await addonRepository.save(
      makeAddon({
        id: '77777777-7777-4777-8777-777777777772',
        name: 'Excluído',
        deletedAt: new Date(),
      }),
    );

    const result = await useCase.execute({ organizationId: STORE_ID });

    expect(Array.isArray(result)).toBe(true);
    const items = result as Awaited<ReturnType<typeof addonRepository.findAll>>;
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Bacon');
  });

  it('com active=false, traz também os excluídos', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(
      makeAddon({ id: '77777777-7777-4777-8777-777777777771', name: 'Bacon' }),
    );
    await addonRepository.save(
      makeAddon({
        id: '77777777-7777-4777-8777-777777777772',
        name: 'Excluído',
        deletedAt: new Date(),
      }),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      active: false,
    });

    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBe(2);
  });

  it('com page/perPage, devolve resultado paginado', async () => {
    const { useCase, addonRepository } = setup();
    for (let i = 0; i < 3; i += 1) {
      await addonRepository.save(
        makeAddon({
          id: `77777777-7777-4777-8777-77777777777${i}`,
          name: `Adicional ${i}`,
        }),
      );
    }

    const result = await useCase.execute({
      organizationId: STORE_ID,
      page: 1,
      perPage: 2,
    });

    expect(Array.isArray(result)).toBe(false);
    if (!Array.isArray(result)) {
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    }
  });
});
