import { FindPermissionProfileByIdUseCase } from './find-permission-profile-by-id.use-case';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import {
  makePermissionProfile,
  makePermissionProfileRepositories,
  PERMISSION_PROFILE_ID,
} from '../../../tests/permission-profile-test-factory';
import { ORGANIZATION_ID } from '../../../tests/tenancy-test-factory';

describe('FindPermissionProfileByIdUseCase', () => {
  function setup() {
    const repos = makePermissionProfileRepositories();
    const useCase = new FindPermissionProfileByIdUseCase(
      repos.permissionProfileRepository,
    );
    return { ...repos, useCase };
  }

  it('devolve o perfil pelo id', async () => {
    const { useCase, permissionProfileRepository } = setup();
    await permissionProfileRepository.save(makePermissionProfile());

    const profile = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PERMISSION_PROFILE_ID,
    });

    expect(profile.name).toBe('Operador customizado');
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
