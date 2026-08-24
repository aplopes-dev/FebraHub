import { CreateUserUseCase } from './create-user.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { FakeKeycloakUserProvider } from '../../../tests/fake-keycloak-user.provider';
import { User } from '../../../domain/entities/user.entity';
import { UserEmailTakenError } from '../../../domain/errors/user-email-taken.error';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repo: InMemoryUserRepository;
  let keycloak: FakeKeycloakUserProvider;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    keycloak = new FakeKeycloakUserProvider();
    useCase = new CreateUserUseCase(repo, keycloak);
  });

  it('should create user and persist it', async () => {
    const result = await useCase.execute({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result).toBeInstanceOf(User);
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].email).toBe('user@test.com');
  });

  it('should create user in Keycloak and store the sub', async () => {
    await useCase.execute({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(keycloak.createdUsers).toHaveLength(1);
    const saved = repo.getAll()[0];
    expect(saved.keycloakSub).toBe(keycloak.createdUsers[0].keycloakSub);
  });

  it('should send invite when sendInvite is true', async () => {
    await useCase.execute({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      sendInvite: true,
    });

    expect(keycloak.createdUsers[0].data.sendInvite).toBe(true);
  });

  it('should not send invite by default', async () => {
    await useCase.execute({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(keycloak.createdUsers[0].data.sendInvite).toBe(false);
  });

  it('should throw UserEmailTakenError if email already registered', async () => {
    await useCase.execute({
      email: 'user@test.com',
      firstName: 'First',
      lastName: 'User',
    });

    await expect(
      useCase.execute({
        email: 'user@test.com',
        firstName: 'Second',
        lastName: 'User',
      }),
    ).rejects.toBeInstanceOf(UserEmailTakenError);
  });

  it('should not call Keycloak if email is already taken', async () => {
    await useCase.execute({
      email: 'user@test.com',
      firstName: 'First',
      lastName: 'User',
    });
    keycloak.clear();

    await expect(
      useCase.execute({
        email: 'user@test.com',
        firstName: 'Second',
        lastName: 'User',
      }),
    ).rejects.toThrow();

    expect(keycloak.createdUsers).toHaveLength(0);
  });
});
