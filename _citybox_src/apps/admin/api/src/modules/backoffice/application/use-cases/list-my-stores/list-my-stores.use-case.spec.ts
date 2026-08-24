import { ListMyStoresUseCase } from './list-my-stores.use-case';
import type { MyStoreView } from '../../../domain/my-store.view';
import type { BackofficeStoreRepository } from '../../../infrastructure/database/backoffice-store.repository';

describe('ListMyStoresUseCase', () => {
  const storeA: MyStoreView = {
    id: 'store-a',
    name: 'Loja A',
    slug: 'loja-a',
    vertical: 'food',
    clientId: 'client-1',
    clientName: 'Org A',
  };
  const storeB: MyStoreView = {
    id: 'store-b',
    name: 'Loja B',
    slug: 'loja-b',
    vertical: 'varejo',
    clientId: 'client-1',
    clientName: 'Org A',
  };

  function createUseCase(stores: MyStoreView[]) {
    const repo: Pick<BackofficeStoreRepository, 'listStoresForMember'> = {
      listStoresForMember: jest.fn(async (sub: string) =>
        sub === 'kc-member' ? stores : [],
      ),
    };
    return {
      useCase: new ListMyStoresUseCase(repo as BackofficeStoreRepository),
      repo,
    };
  }

  it('returns stores linked to the authenticated keycloak sub', async () => {
    const { useCase } = createUseCase([storeA, storeB]);
    await expect(useCase.execute('kc-member')).resolves.toEqual([
      storeA,
      storeB,
    ]);
  });

  it('returns empty list for non-members', async () => {
    const { useCase } = createUseCase([storeA]);
    await expect(useCase.execute('kc-stranger')).resolves.toEqual([]);
  });

  it('returns empty list for blank keycloak sub without hitting repository', async () => {
    const { useCase, repo } = createUseCase([storeA]);
    await expect(useCase.execute('   ')).resolves.toEqual([]);
    expect(repo.listStoresForMember).not.toHaveBeenCalled();
  });
});
