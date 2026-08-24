import { ResetMemberPasswordUseCase } from './reset-member-password.use-case';
import { MemberNotInStoreError } from '../../../domain/errors/member.errors';
import type { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import type {
  MemberRepository,
  MemberRecord,
} from '../../../domain/repositories/member.repository';

const STORE = '0196f0a0-0000-7000-8000-0000000000dd';

function member(): MemberRecord {
  return {
    id: 'member-1',
    organizationId: 'org-1',
    keycloakSub: 'sub-1',
    username: 'ana',
    email: 'ana@salon.com',
    firstName: 'Ana',
    lastName: 'Silva',
    phone: null,
    status: 'active',
    organizationRole: 'COLLABORATOR',
    hasPassword: true,
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
  };
}

describe('ResetMemberPasswordUseCase', () => {
  let members: jest.Mocked<
    Pick<MemberRepository, 'findInStore' | 'markProvisionalPassword'>
  >;
  let identityProvider: jest.Mocked<
    Pick<IdentityProvider, 'setProvisionalPassword'>
  >;
  let useCase: ResetMemberPasswordUseCase;

  beforeEach(() => {
    members = {
      findInStore: jest.fn(),
      markProvisionalPassword: jest.fn(),
    };
    identityProvider = {
      setProvisionalPassword: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ResetMemberPasswordUseCase(
      members as unknown as MemberRepository,
      identityProvider as unknown as IdentityProvider,
    );
  });

  it('gera senha provisória do membro da loja', async () => {
    members.findInStore.mockResolvedValue(member());
    const result = await useCase.execute({
      storeId: STORE,
      memberId: 'member-1',
    });
    expect(result.username).toBe('ana');
    expect(result.provisionalPassword).toHaveLength(10);
    expect(identityProvider.setProvisionalPassword).toHaveBeenCalledWith(
      'sub-1',
      result.provisionalPassword,
    );
    expect(members.markProvisionalPassword).toHaveBeenCalled();
  });

  it('404 quando o membro não está na loja', async () => {
    members.findInStore.mockResolvedValue(null);
    await expect(
      useCase.execute({ storeId: STORE, memberId: 'missing' }),
    ).rejects.toBeInstanceOf(MemberNotInStoreError);
  });
});
