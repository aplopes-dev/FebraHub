import { DeletePermissionProfileUseCase } from './delete-permission-profile.use-case';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNotRemovableError } from '../../../domain/errors/permission-profile-not-removable.error';
import { PermissionProfileInUseError } from '../../../domain/errors/permission-profile-in-use.error';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
  makeSystemPermissionProfile,
  PERMISSION_PROFILE_ID,
  SYSTEM_PERMISSION_PROFILE_ID,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('DeletePermissionProfileUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new DeletePermissionProfileUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('soft-delete de perfil customizado sem membros', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
    });

    const deleted = await permissionProfileRepository.findById(
      ORGANIZATION_ID,
      PERMISSION_PROFILE_ID,
    );
    expect(deleted?.deletedAt).not.toBeNull();
  });

  it('recusa exclusão de perfil de sistema', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makeSystemPermissionProfile());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: SYSTEM_PERMISSION_PROFILE_ID,
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotRemovableError);
  });

  it('permite excluir perfil seedado que não é Administrador', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({
        name: 'Caixa',
        systemKey: 'caixa',
        isSystem: false,
      }),
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
    });

    const deleted = await permissionProfileRepository.findById(
      ORGANIZATION_ID,
      PERMISSION_PROFILE_ID,
    );
    expect(deleted?.deletedAt).not.toBeNull();
  });

  it('recusa exclusão quando há membros vinculados', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());
    permissionProfileRepository.setMembershipCount(PERMISSION_PROFILE_ID, 2);

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
      }),
    ).rejects.toBeInstanceOf(PermissionProfileInUseError);
  });

  it('rejeita perfil inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotFoundError);
  });
});
