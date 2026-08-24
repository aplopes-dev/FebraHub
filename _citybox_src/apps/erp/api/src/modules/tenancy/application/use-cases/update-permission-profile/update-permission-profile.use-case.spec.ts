import { UpdatePermissionProfileUseCase } from './update-permission-profile.use-case';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNotRemovableError } from '../../../domain/errors/permission-profile-not-removable.error';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
  makeSystemPermissionProfile,
  PERMISSION_PROFILE_ID,
  SAMPLE_PERMISSION_IDS,
  SYSTEM_PERMISSION_PROFILE_ID,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('UpdatePermissionProfileUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new UpdatePermissionProfileUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('atualiza nome, descrição e permissões de perfil customizado', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
      name: '  Novo nome  ',
      description: 'Nova descrição',
      permissionIds: [...SAMPLE_PERMISSION_IDS],
    });

    expect(updated.name).toBe('Novo nome');
    expect(updated.description).toBe('Nova descrição');
  });

  it('recusa qualquer edição de perfil de sistema', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makeSystemPermissionProfile());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: SYSTEM_PERMISSION_PROFILE_ID,
        name: 'Hack',
        description: '',
        permissionIds: [...SAMPLE_PERMISSION_IDS],
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotRemovableError);
  });

  it('permite editar perfil seedado que não é Administrador', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({
        name: 'Gerente',
        systemKey: 'gerente',
        isSystem: false,
      }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
      name: 'Gerente regional',
      description: 'Ajustado',
      permissionIds: [...SAMPLE_PERMISSION_IDS],
    });

    expect(updated.name).toBe('Gerente regional');
    expect(updated.description).toBe('Ajustado');
  });

  it('rejeita nome já usado por outro ativo', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());
    await permissionProfileRepository.save(
      makePermissionProfile({ id: 'other-id', name: 'Ocupado' }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
        name: 'ocupado',
        description: '',
        permissionIds: [...SAMPLE_PERMISSION_IDS],
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNameTakenError);
  });

  it('rejeita perfil excluído', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(
      makePermissionProfile({ deletedAt: new Date() }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PERMISSION_PROFILE_ID,
        name: 'X',
        description: '',
        permissionIds: [...SAMPLE_PERMISSION_IDS],
      }),
    ).rejects.toBeInstanceOf(PermissionProfileNotFoundError);
  });
});
