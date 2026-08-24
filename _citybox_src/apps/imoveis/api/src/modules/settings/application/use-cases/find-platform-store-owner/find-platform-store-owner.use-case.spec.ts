import { NotFoundException } from '@nestjs/common';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { FindPlatformStoreOwnerUseCase } from './find-platform-store-owner.use-case';

const STORE = '0196f0a0-0000-7000-8000-000000000002';

describe('FindPlatformStoreOwnerUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: FindPlatformStoreOwnerUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new FindPlatformStoreOwnerUseCase(members);
  });

  it('devolve o admin ativo da loja', async () => {
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

    const owner = await useCase.execute({ storeId: STORE });
    expect(owner.agentId).toBe('ana');
    expect(owner.role).toBe('admin');
  });

  it('404 quando não há admin ativo', async () => {
    await expect(useCase.execute({ storeId: STORE })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
