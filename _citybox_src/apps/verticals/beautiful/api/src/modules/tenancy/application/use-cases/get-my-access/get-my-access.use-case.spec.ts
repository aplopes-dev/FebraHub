import { GetMyAccessUseCase } from './get-my-access.use-case';
import type {
  MemberRecord,
  MemberRepository,
} from '../../../domain/repositories/member.repository';
import type {
  OrganizationRecord,
  OrganizationRepository,
} from '../../../domain/repositories/tenancy.repositories';

function member(overrides: Partial<MemberRecord> = {}): MemberRecord {
  return {
    id: 'm1',
    organizationId: 'org1',
    keycloakSub: 'sub-1',
    username: 'maria',
    email: 'maria@example.com',
    firstName: 'Maria',
    lastName: 'Silva',
    phone: null,
    status: 'active',
    organizationRole: 'OWNER',
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    memberships: [
      {
        storeId: 'store-1',
        storeName: 'Beautiful Demo',
        role: 'profissional',
        permissions: [],
      },
    ],
    ...overrides,
  };
}

describe('GetMyAccessUseCase', () => {
  it('retorna member null quando sub não é membro', async () => {
    const members = {
      findByKeycloakSub: async () => null,
    } as unknown as MemberRepository;
    const organizations = {
      findById: async () => null,
    } as unknown as OrganizationRepository;

    const useCase = new GetMyAccessUseCase(members, organizations);
    await expect(useCase.execute('unknown')).resolves.toEqual({
      member: null,
      organization: null,
      stores: [],
    });
  });

  it('retorna lojas do membro e marca senha no primeiro acesso', async () => {
    const markPasswordSetCalls: string[] = [];
    const pending = member({ hasPassword: false });
    const members = {
      findByKeycloakSub: async () => pending,
      markPasswordSet: async (id: string) => {
        markPasswordSetCalls.push(id);
      },
    } as unknown as MemberRepository;
    const org: OrganizationRecord = {
      id: 'org1',
      name: 'Org',
      status: 'active',
    };
    const organizations = {
      findById: async () => org,
    } as unknown as OrganizationRepository;

    const useCase = new GetMyAccessUseCase(members, organizations);
    const result = await useCase.execute('sub-1');

    expect(markPasswordSetCalls).toEqual(['m1']);
    expect(result.member?.isOrganizationOwner).toBe(true);
    expect(result.stores).toHaveLength(1);
    expect(result.stores[0]).toMatchObject({
      storeId: 'store-1',
      name: 'Beautiful Demo',
      role: 'profissional',
    });
    expect(result.stores[0]?.permissions.length).toBeGreaterThan(0);
    expect(result.organization).toEqual(org);
  });
});
