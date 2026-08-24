import { NotFoundException } from '@nestjs/common';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { FakeIdentityProvider } from '../../../../tenancy/tests/fake-identity.provider';
import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { ResetTeamMemberPasswordUseCase } from '../reset-team-member-password/reset-team-member-password.use-case';
import { ResetPlatformStoreOwnerPasswordUseCase } from './reset-platform-store-owner-password.use-case';

const STORE = '0196f0a0-0000-7000-8000-000000000003';

describe('ResetPlatformStoreOwnerPasswordUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: ResetPlatformStoreOwnerPasswordUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    const reset = new ResetTeamMemberPasswordUseCase(
      members,
      new FakeIdentityProvider(),
    );
    useCase = new ResetPlatformStoreOwnerPasswordUseCase(members, reset);
  });

  it('gera senha provisória do admin', async () => {
    await members.create(STORE, {
      agentId: 'ana',
      name: 'Ana',
      email: 'ana@imob.com',
      phone: '',
      role: 'admin',
      initials: 'A',
      active: true,
      permissions: permissionsForRole('admin'),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: true,
      keycloakSub: 'sub-1',
      username: 'ana',
      hasPassword: false,
    });

    const result = await useCase.execute({ storeId: STORE });
    expect(result.username).toBe('ana');
    expect(result.provisionalPassword).toHaveLength(10);
  });

  it('404 quando não há admin', async () => {
    await expect(useCase.execute({ storeId: STORE })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
