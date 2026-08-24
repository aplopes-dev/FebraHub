import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { PlatformPrisma } from '../src/database/platform.js';
import { UserStoreAssignmentsService } from '../src/users/user-store-assignments.service.js';

describe('UserStoreAssignmentsService', () => {
  it('lista lojas ativas vinculadas ao keycloakSub autenticado via platform.store_members', async () => {
    const queryRaw = mock.fn(async () => [
      {
        id: 'store-1',
        name: 'Restaurante Sol',
        slug: 'restaurante-sol',
        vertical: 'food',
      },
      {
        id: 'store-2',
        name: 'Advocacia Ilhéus',
        slug: 'advocacia-ilheus',
        vertical: 'legal',
      },
    ]);
    const platform = { $queryRaw: queryRaw } as unknown as PlatformPrisma;

    const svc = new UserStoreAssignmentsService(platform);
    const stores = await svc.listForUser('user-sub');
    assert.deepEqual(stores, [
      { id: 'store-1', name: 'Restaurante Sol', slug: 'restaurante-sol', vertical: 'food' },
      { id: 'store-2', name: 'Advocacia Ilhéus', slug: 'advocacia-ilheus', vertical: 'legal' },
    ]);
    assert.equal(queryRaw.mock.callCount(), 1);
  });

  it('retorna vazio sem vínculos', async () => {
    const platform = {
      $queryRaw: mock.fn(async () => []),
    } as unknown as PlatformPrisma;

    const svc = new UserStoreAssignmentsService(platform);
    const stores = await svc.listForUser('user-sub');
    assert.deepEqual(stores, []);
  });
});
