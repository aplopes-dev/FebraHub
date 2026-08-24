import { ListPermissionProfilesUseCase } from './list-permission-profiles.use-case';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('ListPermissionProfilesUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new ListPermissionProfilesUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('lista só ativos por padrão, ordenados por nome', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ id: 'p-1', name: 'Beta' }),
    );
    await permissionProfileRepository.save(
      makePermissionProfile({ id: 'p-2', name: 'Alpha' }),
    );
    await permissionProfileRepository.save(
      makePermissionProfile({
        id: 'p-3',
        name: 'Zeta excluído',
        deletedAt: new Date(),
      }),
    );

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.total).toBe(2);
    expect(result.items.map((p) => p.name)).toEqual(['Alpha', 'Beta']);
  });

  it('filtra por busca no nome', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ id: 'p-1', name: 'Caixa PDV' }),
    );
    await permissionProfileRepository.save(
      makePermissionProfile({ id: 'p-2', name: 'Gerente' }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'caixa',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.name).toBe('Caixa PDV');
  });
});
