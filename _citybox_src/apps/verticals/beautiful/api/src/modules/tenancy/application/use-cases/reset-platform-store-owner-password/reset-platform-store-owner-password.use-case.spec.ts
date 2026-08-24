import { NotFoundException } from '@nestjs/common';
import { FakeIdentityProvider } from '../../../tests/fake-identity.provider';
import { ResetPlatformStoreOwnerPasswordUseCase } from './reset-platform-store-owner-password.use-case';
import type {
  MemberRepository,
  MemberRecord,
} from '../../../domain/repositories/member.repository';

const STORE = '0196f0a0-0000-7000-8000-0000000000dd';

function owner(): MemberRecord {
  return {
    id: 'member-owner',
    organizationId: 'org-1',
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
      { storeId: STORE, storeName: 'Salon', role: 'owner', permissions: [] },
    ],
  };
}

describe('ResetPlatformStoreOwnerPasswordUseCase', () => {
  let members: jest.Mocked<
    Pick<
      MemberRepository,
      'findActiveOwnerByStoreId' | 'markProvisionalPassword'
    >
  >;
  let identityProvider: FakeIdentityProvider;
  let useCase: ResetPlatformStoreOwnerPasswordUseCase;

  beforeEach(() => {
    members = {
      findActiveOwnerByStoreId: jest.fn(),
      markProvisionalPassword: jest.fn(),
    };
    identityProvider = new FakeIdentityProvider();
    useCase = new ResetPlatformStoreOwnerPasswordUseCase(
      members as unknown as MemberRepository,
      identityProvider,
    );
  });

  it('gera senha provisória do OWNER', async () => {
    members.findActiveOwnerByStoreId.mockResolvedValue(owner());
    const result = await useCase.execute({ storeId: STORE });
    expect(result.username).toBe('ana');
    expect(result.provisionalPassword).toHaveLength(10);
    expect(identityProvider.passwords.get('sub-1')).toBe(
      result.provisionalPassword,
    );
    expect(members.markProvisionalPassword).toHaveBeenCalled();
  });

  it('404 quando não há OWNER', async () => {
    members.findActiveOwnerByStoreId.mockResolvedValue(null);
    await expect(useCase.execute({ storeId: STORE })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
