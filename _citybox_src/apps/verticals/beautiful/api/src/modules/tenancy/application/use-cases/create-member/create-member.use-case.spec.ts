import { CreateMemberUseCase } from './create-member.use-case';
import { FakeIdentityProvider } from '../../../tests/fake-identity.provider';
import type {
  MemberRecord,
  MemberRepository,
} from '../../../domain/repositories/member.repository';
import type {
  OrganizationRepository,
  StoreRepository,
} from '../../../domain/repositories/tenancy.repositories';
import { MemberUsernameTakenError } from '../../../domain/errors/member.errors';
import { InvalidStoreRoleError } from '../../../domain/errors/member.errors';

describe('CreateMemberUseCase', () => {
  function harness(opts?: { usernameTaken?: boolean }) {
    const created: MemberRecord[] = [];
    const members = {
      findByUsername: async () =>
        opts?.usernameTaken
          ? ({ id: 'existing', username: 'taken' } as MemberRecord)
          : null,
      create: async (data: {
        organizationId: string;
        keycloakSub: string;
        username: string;
        email: string | null;
        firstName: string;
        lastName: string;
        phone?: string | null;
        hasPassword: boolean;
        stores: Array<{ storeId: string; role: string; permissions: string[] }>;
      }) => {
        const record: MemberRecord = {
          id: 'new-member',
          organizationId: data.organizationId,
          keycloakSub: data.keycloakSub,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? null,
          status: 'active',
          organizationRole: 'COLLABORATOR',
          hasPassword: data.hasPassword,
          provisionalExpiresAt: null,
          disabledAt: null,
          memberships: data.stores.map((s) => ({
            storeId: s.storeId,
            storeName: 'Loja',
            role: s.role,
            permissions: s.permissions,
          })),
        };
        created.push(record);
        return record;
      },
      findById: async (id: string) => created.find((m) => m.id === id) ?? null,
      markProvisionalPassword: async () => undefined,
    } as unknown as MemberRepository;

    const organizations = {
      findByStoreId: async () => ({
        id: 'org-1',
        name: 'Org',
        status: 'active' as const,
      }),
    } as unknown as OrganizationRepository;

    const stores = {
      findById: async () => ({
        id: 'store-1',
        organizationId: 'org-1',
        name: 'Loja',
        status: 'active' as const,
      }),
    } as unknown as StoreRepository;

    const identityProvider = new FakeIdentityProvider();

    return {
      useCase: new CreateMemberUseCase(
        members,
        organizations,
        stores,
        identityProvider,
      ),
      created,
      identityProvider,
    };
  }

  it('provisiona identidade + Member', async () => {
    const { useCase, created, identityProvider } = harness();
    const result = await useCase.execute({
      storeId: 'store-1',
      firstName: 'Ana',
      lastName: 'Costa',
      username: 'ana',
      email: 'ana@example.com',
      phone: '73999990000',
      role: 'profissional',
    });

    expect(result.member.username).toBe('ana');
    expect(result.provisionalPassword.length).toBe(10);
    expect(created[0]?.phone).toBe('73999990000');
    expect(created[0]?.memberships[0]?.permissions).toEqual(
      expect.arrayContaining(['schedule_view_menu', 'client_read']),
    );
    expect(identityProvider.users.size).toBe(1);
    expect([...identityProvider.passwords.values()]).toEqual([
      result.provisionalPassword,
    ]);
  });

  it('remove a identidade recém-criada quando a senha falha', async () => {
    const { useCase, identityProvider } = harness();
    identityProvider.failOnSetPassword = true;

    await expect(
      useCase.execute({
        storeId: 'store-1',
        firstName: 'Ana',
        lastName: 'Costa',
        username: 'ana',
        email: 'ana@example.com',
      }),
    ).rejects.toThrow(/senha provisória/);

    expect(identityProvider.deleted).toHaveLength(1);
    expect(identityProvider.users.size).toBe(0);
  });

  it('preserva identidade reaproveitada quando a senha falha', async () => {
    const { useCase, identityProvider } = harness();
    identityProvider.seedUser('ana', 'ana@example.com');
    identityProvider.failOnSetPassword = true;

    await expect(
      useCase.execute({
        storeId: 'store-1',
        firstName: 'Ana',
        lastName: 'Costa',
        username: 'ana',
        email: 'ana@example.com',
      }),
    ).rejects.toThrow(/senha provisória/);

    expect(identityProvider.deleted).toEqual([]);
    expect(identityProvider.users.size).toBe(1);
  });

  it('recusa permissões inválidas', async () => {
    const { useCase } = harness();
    await expect(
      useCase.execute({
        storeId: 'store-1',
        firstName: 'Ana',
        lastName: 'Costa',
        username: 'ana',
        role: 'profissional',
        permissions: ['not_a_real_permission'],
      }),
    ).rejects.toThrow(/Permissões inválidas/);
  });

  it('recusa cargo operacional owner (fora do catálogo)', async () => {
    const { useCase } = harness();
    await expect(
      useCase.execute({
        storeId: 'store-1',
        firstName: 'Ana',
        lastName: 'Costa',
        username: 'ana',
        role: 'owner',
      }),
    ).rejects.toBeInstanceOf(InvalidStoreRoleError);
  });

  it('permite criar gerente com permissões customizadas', async () => {
    const { useCase, created } = harness();
    await useCase.execute({
      storeId: 'store-1',
      firstName: 'Ana',
      lastName: 'Costa',
      username: 'ana',
      role: 'gerente',
      permissions: ['schedule_view_menu', 'client_read'],
    });
    expect(created[0]?.memberships[0]?.role).toBe('gerente');
    expect(created[0]?.memberships[0]?.permissions).toEqual([
      'schedule_view_menu',
      'client_read',
    ]);
  });

  it('recusa username duplicado', async () => {
    const { useCase } = harness({ usernameTaken: true });
    await expect(
      useCase.execute({
        storeId: 'store-1',
        firstName: 'Ana',
        lastName: 'Costa',
        username: 'taken',
      }),
    ).rejects.toBeInstanceOf(MemberUsernameTakenError);
  });
});
