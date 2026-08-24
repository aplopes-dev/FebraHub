import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { User } from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase;
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new FindUserByIdUseCase(repo);
  });

  it('should return user when found', async () => {
    const user = User.create({
      keycloakSub: 'sub-abc',
      email: 'user@test.com',
      displayName: 'Test',
      photoKey: null,
      photoMimeType: null,
    });
    await repo.save(user);

    const result = await useCase.execute({ id: user.id });
    expect(result.id).toBe(user.id);
    expect(result.email).toBe('user@test.com');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('error should carry correct externalMessage and context', async () => {
    try {
      await useCase.execute({ id: 'missing' });
    } catch (e) {
      expect((e as UserNotFoundError).externalMessage).toBe(
        'Usuário não encontrado',
      );
      expect((e as UserNotFoundError).context).toBe('FindUserByIdUseCase');
    }
  });
});
