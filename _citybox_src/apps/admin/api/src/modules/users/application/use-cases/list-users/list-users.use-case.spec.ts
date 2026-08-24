import { ListUsersUseCase } from './list-users.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { User } from '../../../domain/entities/user.entity';

const makeUser = (
  email: string,
  options?: {
    displayName?: string;
    role?: 'platform_admin' | 'platform_operator';
  },
) =>
  User.create({
    keycloakSub: `sub-${email}`,
    email,
    displayName: options?.displayName ?? 'Test User',
    role: options?.role ?? 'platform_operator',
    photoKey: null,
    photoMimeType: null,
  });

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new ListUsersUseCase(repo);
  });

  it('should return empty list when no users exist', async () => {
    const result = await useCase.execute({});
    expect(result.users).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should return paginated users with correct meta', async () => {
    await repo.save(makeUser('a@test.com'));
    await repo.save(makeUser('b@test.com'));
    await repo.save(makeUser('c@test.com'));

    const result = await useCase.execute({ page: 1, perPage: 2 });
    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(2);
  });

  it('should default to page 1 and perPage 20', async () => {
    const result = await useCase.execute({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it('should filter users by search term', async () => {
    await repo.save(makeUser('joao@test.com', { displayName: 'João Silva' }));
    await repo.save(makeUser('maria@test.com', { displayName: 'Maria Souza' }));

    const result = await useCase.execute({ search: 'joao' });
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.users[0]?.email).toBe('joao@test.com');
  });

  it('should filter users by role', async () => {
    await repo.save(makeUser('admin@test.com', { role: 'platform_admin' }));
    await repo.save(
      makeUser('operator@test.com', { role: 'platform_operator' }),
    );

    const result = await useCase.execute({ roles: ['platform_admin'] });
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.users[0]?.role).toBe('platform_admin');
  });

  it('should filter users by search and role combined', async () => {
    await repo.save(
      makeUser('admin1@test.com', {
        displayName: 'Admin One',
        role: 'platform_admin',
      }),
    );
    await repo.save(
      makeUser('admin2@test.com', {
        displayName: 'Other Person',
        role: 'platform_admin',
      }),
    );
    await repo.save(
      makeUser('operator@test.com', {
        displayName: 'Admin Operator',
        role: 'platform_operator',
      }),
    );

    const result = await useCase.execute({
      search: 'one',
      roles: ['platform_admin'],
    });
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.users[0]?.email).toBe('admin1@test.com');
  });
});
