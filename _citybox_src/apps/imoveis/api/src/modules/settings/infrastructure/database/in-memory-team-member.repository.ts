import { TeamMemberEntity } from '../../domain/entities/team-member.entity';
import {
  TeamMemberRepository,
  type TeamMemberCreatePayload,
  type TeamMemberCredentialsPayload,
  type TeamMemberKeycloakPayload,
  type TeamMemberWritePayload,
} from '../../domain/repositories/team-member.repository.interface';

function keyOf(storeId: string, agentId: string): string {
  return `${storeId}::${agentId}`;
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryTeamMemberRepository extends TeamMemberRepository {
  private readonly members = new Map<string, TeamMemberEntity>();

  async findAll(storeId: string): Promise<TeamMemberEntity[]> {
    await Promise.resolve();
    return [...this.members.values()]
      .filter((member) => member.storeId === storeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<TeamMemberEntity | null> {
    await Promise.resolve();
    return this.members.get(keyOf(storeId, agentId)) ?? null;
  }

  async findActiveByAgentIdGlobal(
    agentId: string,
  ): Promise<TeamMemberEntity[]> {
    await Promise.resolve();
    // Map preserva ordem de inserção ≈ createdAt asc
    return [...this.members.values()].filter(
      (member) => member.agentId === agentId && member.active,
    );
  }

  async findByEmail(
    storeId: string,
    email: string,
  ): Promise<TeamMemberEntity | null> {
    const all = await this.findAll(storeId);
    const normalized = email.trim().toLowerCase();
    return (
      all.find((member) => member.email.toLowerCase() === normalized) ?? null
    );
  }

  async findActiveAdmin(storeId: string): Promise<TeamMemberEntity | null> {
    const all = await this.findAll(storeId);
    return (
      all.find((member) => member.role === 'admin' && member.active) ?? null
    );
  }

  async findByKeycloakSub(keycloakSub: string): Promise<TeamMemberEntity[]> {
    await Promise.resolve();
    return [...this.members.values()].filter(
      (member) => member.keycloakSub === keycloakSub && member.active,
    );
  }

  async findByStoreAndKeycloakSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<TeamMemberEntity | null> {
    await Promise.resolve();
    const member = [...this.members.values()].find(
      (m) => m.storeId === storeId && m.keycloakSub === keycloakSub,
    );
    return member ?? null;
  }

  async findByEmailInsensitive(email: string): Promise<TeamMemberEntity[]> {
    await Promise.resolve();
    const normalized = email.trim().toLowerCase();
    return [...this.members.values()].filter(
      (m) => m.email.toLowerCase() === normalized && m.active,
    );
  }

  async linkKeycloakSub(
    memberId: string,
    payload: TeamMemberKeycloakPayload,
  ): Promise<TeamMemberEntity | null> {
    await Promise.resolve();
    const entry = [...this.members.entries()].find(
      ([, member]) => member.id === memberId,
    );
    if (!entry) return null;
    const [mapKey, existing] = entry;
    const entity = TeamMemberEntity.create(
      {
        ...existing.props,
        keycloakSub: payload.keycloakSub,
        username: payload.username,
        hasPassword: payload.hasPassword ?? false,
      },
      existing.id,
    );
    this.members.set(mapKey, entity);
    return entity;
  }

  async markPasswordSet(memberId: string): Promise<void> {
    await Promise.resolve();
    const entry = [...this.members.entries()].find(
      ([, member]) => member.id === memberId,
    );
    if (!entry) return;
    const [mapKey, existing] = entry;
    this.members.set(
      mapKey,
      TeamMemberEntity.create(
        { ...existing.props, hasPassword: true, mustChangePassword: false },
        existing.id,
      ),
    );
  }

  async create(
    storeId: string,
    payload: TeamMemberCreatePayload,
  ): Promise<TeamMemberEntity> {
    await Promise.resolve();
    const entity = TeamMemberEntity.create({
      storeId,
      agentId: payload.agentId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      initials: payload.initials,
      active: payload.active,
      permissions: payload.permissions,
      lastAccessAt: payload.lastAccessAt,
      passwordHash: payload.passwordHash,
      temporaryPassword: payload.temporaryPassword,
      mustChangePassword: payload.mustChangePassword,
      keycloakSub: payload.keycloakSub ?? null,
      username: payload.username ?? null,
      hasPassword: payload.hasPassword ?? false,
    });
    this.members.set(keyOf(storeId, payload.agentId), entity);
    return entity;
  }

  async update(
    storeId: string,
    agentId: string,
    payload: TeamMemberWritePayload,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = TeamMemberEntity.create(
      { ...existing.props, ...payload },
      existing.id,
    );
    this.members.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async updateCredentials(
    storeId: string,
    agentId: string,
    payload: TeamMemberCredentialsPayload,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = TeamMemberEntity.create(
      { ...existing.props, ...payload },
      existing.id,
    );
    this.members.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async setActive(
    storeId: string,
    agentId: string,
    active: boolean,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = TeamMemberEntity.create(
      { ...existing.props, active },
      existing.id,
    );
    this.members.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async delete(storeId: string, agentId: string): Promise<boolean> {
    await Promise.resolve();
    return this.members.delete(keyOf(storeId, agentId));
  }
}
