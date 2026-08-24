import { DeleteUserUseCase } from './delete-user.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { FakeKeycloakUserProvider } from '../../../tests/fake-keycloak-user.provider';
import { User } from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let repo: InMemoryUserRepository;
  let keycloak: FakeKeycloakUserProvider;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    keycloak = new FakeKeycloakUserProvider();
    useCase = new DeleteUserUseCase(repo, keycloak);
  });

  it('should delete user from repository and Keycloak', async () => {
    const user = User.create({
      keycloakSub: 'sub-del',
      email: 'user@test.com',
      displayName: 'To Delete',
      photoKey: null,
      photoMimeType: null,
    });
    await repo.save(user);

    await useCase.execute({ id: user.id });

    expect(repo.getAll()).toHaveLength(0);
    expect(keycloak.deletedSubs).toContain('sub-del');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('should not call Keycloak delete if user is not found', async () => {
    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow();
    expect(keycloak.deletedSubs).toHaveLength(0);
  });
});
