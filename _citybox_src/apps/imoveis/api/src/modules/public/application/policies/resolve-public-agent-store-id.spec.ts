import { permissionsForRole } from '../../../settings/domain/entities/team-member.entity';
import { InMemoryTeamMemberRepository } from '../../../settings/infrastructure/database/in-memory-team-member.repository';
import { PublicAgentNotFoundError } from '../../domain/errors/public-agent-not-found.error';
import { resolvePublicAgentStoreId } from './resolve-public-agent-store-id';

async function seedMember(
  repo: InMemoryTeamMemberRepository,
  storeId: string,
  agentId: string,
  active = true,
) {
  await repo.create(storeId, {
    agentId,
    name: agentId,
    email: `${agentId}@${storeId}.test`,
    phone: '',
    role: 'broker',
    initials: 'XX',
    active,
    permissions: permissionsForRole('broker'),
    temporaryPassword: null,
    passwordHash: null,
    mustChangePassword: false,
    lastAccessAt: null,
  });
}

describe('resolvePublicAgentStoreId', () => {
  it('resolve loja única pelo slug', async () => {
    const members = new InMemoryTeamMemberRepository();
    await seedMember(members, 'store-a', 'daniel');

    await expect(
      resolvePublicAgentStoreId(members, 'daniel', 'test'),
    ).resolves.toBe('store-a');
  });

  it('404 quando slug não existe', async () => {
    const members = new InMemoryTeamMemberRepository();
    await expect(
      resolvePublicAgentStoreId(members, 'inexistente', 'test'),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });

  it('ignora inativos', async () => {
    const members = new InMemoryTeamMemberRepository();
    await seedMember(members, 'store-a', 'daniel', false);

    await expect(
      resolvePublicAgentStoreId(members, 'daniel', 'test'),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });

  it('em colisão, prefere preferredStoreId', async () => {
    const members = new InMemoryTeamMemberRepository();
    await seedMember(members, 'store-a', 'ana');
    await seedMember(members, 'store-b', 'ana');

    await expect(
      resolvePublicAgentStoreId(members, 'ana', 'test', 'store-b'),
    ).resolves.toBe('store-b');
  });

  it('em colisão sem preferência, usa o mais antigo', async () => {
    const members = new InMemoryTeamMemberRepository();
    await seedMember(members, 'store-a', 'ana');
    await seedMember(members, 'store-b', 'ana');

    await expect(
      resolvePublicAgentStoreId(members, 'ana', 'test'),
    ).resolves.toBe('store-a');
  });
});
