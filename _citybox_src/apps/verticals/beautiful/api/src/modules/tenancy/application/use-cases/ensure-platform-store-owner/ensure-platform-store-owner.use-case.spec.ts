import { FakeIdentityProvider } from '../../../tests/fake-identity.provider';
import { EnsurePlatformStoreOwnerUseCase } from './ensure-platform-store-owner.use-case';
import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';
import type {
  MemberRepository,
  MemberRecord,
  CreateMemberData,
} from '../../../domain/repositories/member.repository';
import type {
  OrganizationRepository,
  OrganizationRecord,
  StoreRecord,
} from '../../../domain/repositories/tenancy.repositories';

const STORE = '0196f0a0-0000-7000-8000-0000000000bb';
const ORG = '0196f0a0-0000-7000-8000-0000000000aa';

function member(overrides: Partial<MemberRecord> = {}): MemberRecord {
  return {
    id: 'member-1',
    organizationId: ORG,
    keycloakSub: 'sub-1',
    username: 'ana',
    email: 'ana@salon.com',
    firstName: 'Ana',
    lastName: 'Silva',
    phone: null,
    status: 'active',
    organizationRole: 'OWNER',
    hasPassword: false,
    provisionalExpiresAt: null,
    disabledAt: null,
    memberships: [
      {
        storeId: STORE,
        storeName: 'Salon',
        role: 'profissional',
        permissions: [],
      },
    ],
    ...overrides,
  };
}

describe('EnsurePlatformStoreOwnerUseCase', () => {
  let organizations: jest.Mocked<OrganizationRepository>;
  let members: jest.Mocked<MemberRepository>;
  let identityProvider: FakeIdentityProvider;
  let useCase: EnsurePlatformStoreOwnerUseCase;

  beforeEach(() => {
    organizations = {
      findById: jest.fn(),
      findByStoreId: jest.fn(),
      ensureForPlatformStore: jest.fn().mockResolvedValue({
        organization: {
          id: ORG,
          name: 'Salon',
          status: 'active',
        } satisfies OrganizationRecord,
        store: {
          id: STORE,
          organizationId: ORG,
          name: 'Salon',
          status: 'active',
        } satisfies StoreRecord,
      }),
    };

    members = {
      findById: jest.fn(),
      findByUsername: jest.fn().mockResolvedValue(null),
      findByKeycloakSub: jest.fn().mockResolvedValue(null),
      findActiveOwnerByStoreId: jest.fn().mockResolvedValue(null),
      create: jest.fn(async (data: CreateMemberData) =>
        member({
          organizationId: data.organizationId,
          keycloakSub: data.keycloakSub,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationRole: data.organizationRole ?? 'COLLABORATOR',
        }),
      ),
      linkKeycloak: jest.fn(),
      promoteToOwner: jest.fn(),
      markProvisionalPassword: jest.fn(),
      markPasswordSet: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    identityProvider = new FakeIdentityProvider();

    useCase = new EnsurePlatformStoreOwnerUseCase(
      organizations,
      members,
      identityProvider,
    );
  });

  it('provisiona OWNER sem senha', async () => {
    const result = await useCase.execute({
      storeId: STORE,
      tradeName: 'Salon',
      responsibleName: 'Ana Silva',
      billingEmail: 'ana@salon.com',
    });

    expect(organizations.ensureForPlatformStore).toHaveBeenCalledWith({
      storeId: STORE,
      name: 'Salon',
    });
    // Realm próprio: nenhuma role concedida no provisionamento — estar no
    // realm `citybox-beautiful` já é o gate de acesso (ADR C-16).
    expect([...identityProvider.users.values()]).toEqual([
      expect.objectContaining({ email: 'ana@salon.com', username: 'ana' }),
    ]);
    expect(members.create).toHaveBeenCalled();
    const createArg = members.create.mock.calls[0]?.[0];
    expect(createArg?.stores?.[0]?.role).toBe('profissional');
    expect(createArg?.stores?.[0]?.permissions?.length).toBeGreaterThan(0);
    expect(result.organizationRole).toBe('OWNER');
    expect(result.hasPassword).toBe(false);
  });

  it('falha quando faltam campos do owner', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        tradeName: 'Salon',
        responsibleName: null,
        billingEmail: null,
      }),
    ).rejects.toBeInstanceOf(StorePayloadIncompleteError);
  });

  it('reutiliza OWNER existente', async () => {
    members.findActiveOwnerByStoreId.mockResolvedValue(member());
    members.linkKeycloak.mockResolvedValue(member());

    const result = await useCase.execute({
      storeId: STORE,
      tradeName: 'Salon',
      responsibleName: 'Ana Silva',
      billingEmail: 'ana@salon.com',
    });

    expect(members.create).not.toHaveBeenCalled();
    expect(result.id).toBe('member-1');
  });
});
