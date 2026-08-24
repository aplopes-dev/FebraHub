import { UpdateUserUseCase } from './update-user.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { FakeKeycloakUserProvider } from '../../../tests/fake-keycloak-user.provider';
import { User } from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let repo: InMemoryUserRepository;
  let keycloak: FakeKeycloakUserProvider;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    keycloak = new FakeKeycloakUserProvider();
    useCase = new UpdateUserUseCase(repo, keycloak);
  });

  it('should update displayName from firstName+lastName and persist', async () => {
    const user = User.create({
      keycloakSub: 'sub-abc',
      email: 'user@test.com',
      displayName: 'Old Name',
      photoKey: null,
      photoMimeType: null,
    });
    await repo.save(user);

    const result = await useCase.execute({
      id: user.id,
      firstName: 'New',
      lastName: 'Name',
    });

    expect(result.displayName).toBe('New Name');
    expect(repo.getAll()[0].displayName).toBe('New Name');
  });

  it('should propagate update to Keycloak', async () => {
    const user = User.create({
      keycloakSub: 'sub-abc',
      email: 'user@test.com',
      displayName: 'Old',
      photoKey: null,
      photoMimeType: null,
    });
    await repo.save(user);

    await useCase.execute({ id: user.id, firstName: 'New', lastName: 'Name' });

    expect(keycloak.updatedUsers).toHaveLength(1);
    expect(keycloak.updatedUsers[0].keycloakSub).toBe('sub-abc');
    expect(keycloak.updatedUsers[0].data.firstName).toBe('New');
    expect(keycloak.updatedUsers[0].data.lastName).toBe('Name');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({
        id: 'non-existent',
        firstName: 'Name',
        lastName: 'Test',
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
