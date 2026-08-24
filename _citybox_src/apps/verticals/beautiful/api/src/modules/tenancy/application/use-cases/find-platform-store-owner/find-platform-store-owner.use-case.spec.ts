import { NotFoundException } from '@nestjs/common';
import { FindPlatformStoreOwnerUseCase } from './find-platform-store-owner.use-case';
import type {
  MemberRepository,
  MemberRecord,
} from '../../../domain/repositories/member.repository';

const STORE = '0196f0a0-0000-7000-8000-0000000000cc';

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

describe('FindPlatformStoreOwnerUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findActiveOwnerByStoreId'>>;
  let useCase: FindPlatformStoreOwnerUseCase;

  beforeEach(() => {
    members = {
      findActiveOwnerByStoreId: jest.fn(),
    };
    useCase = new FindPlatformStoreOwnerUseCase(
      members as unknown as MemberRepository,
    );
  });

  it('devolve o OWNER ativo da loja', async () => {
    members.findActiveOwnerByStoreId.mockResolvedValue(owner());
    const result = await useCase.execute({ storeId: STORE });
    expect(result.username).toBe('ana');
    expect(result.organizationRole).toBe('OWNER');
  });

  it('404 quando não há OWNER', async () => {
    members.findActiveOwnerByStoreId.mockResolvedValue(null);
    await expect(useCase.execute({ storeId: STORE })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
