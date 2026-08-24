import { CreatePermissionProfileUseCase } from './create-permission-profile.use-case';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import { PermissionIdsInvalidError } from '../../../domain/errors/permission-ids-invalid.error';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
  SAMPLE_PERMISSION_IDS,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('CreatePermissionProfileUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new CreatePermissionProfileUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('cria perfil customizado com nome aparado', async () => {
    const { useCase } = setup();

    const profile = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Supervisor  ',
      description: 'Acesso operacional',
      permissionIds: [...SAMPLE_PERMISSION_IDS],
    });

    expect(profile.name).toBe('Supervisor');
    expect(profile.isSystem).toBe(false);
    expect(profile.systemKey).toBeNull();
    expect(profile.permissionIds).toEqual([...SAMPLE_PERMISSION_IDS]);
  });

  it('rejeita nome já usado entre ativos', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ name: 'Supervisor' }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'supervisor',
        permissionIds: [...SAMPLE_PERMISSION_IDS],
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNameTakenError);
  });

  it('rejeita permissões fora do catálogo', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'Inválido',
        permissionIds: ['permissao.inexistente'],
      }),
    ).rejects.toBeInstanceOf(PermissionIdsInvalidError);
  });
});
