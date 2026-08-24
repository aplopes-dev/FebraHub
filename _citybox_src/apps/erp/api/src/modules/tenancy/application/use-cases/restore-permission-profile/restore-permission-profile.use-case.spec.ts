import { RestorePermissionProfileUseCase } from './restore-permission-profile.use-case';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
  PERMISSION_PROFILE_ID,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('RestorePermissionProfileUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new RestorePermissionProfileUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('restaura perfil excluído', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ deletedAt: new Date() }),
    );

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
    });

    expect(restored.deletedAt).toBeNull();
  });

  it('é idempotente quando já está ativo', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
    });

    expect(restored.deletedAt).toBeNull();
  });

  it('rejeita se outro ativo já usa o mesmo nome', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ deletedAt: new Date() }),
    );
    await permissionProfileRepository.save(
      makePermissionProfile({
        id: 'other-id',
        name: 'Operador customizado',
      }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNameTakenError);
  });

  it('rejeita id inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotFoundError);
  });
});
