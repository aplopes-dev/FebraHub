import {
  AgentProfileEntity,
  type AgentLegalDocument,
  type AgentProfilePhoto,
  type LegalDocKind,
} from '../../domain/entities/agent-profile.entity';
import {
  AgentProfileRepository,
  type AgentProfileWritePayload,
} from '../../domain/repositories/agent-profile.repository.interface';

function keyOf(storeId: string, agentId: string): string {
  return `${storeId}::${agentId}`;
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryAgentProfileRepository extends AgentProfileRepository {
  private readonly profiles = new Map<string, AgentProfileEntity>();

  async findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<AgentProfileEntity | null> {
    await Promise.resolve();
    return this.profiles.get(keyOf(storeId, agentId)) ?? null;
  }

  async ensure(storeId: string, agentId: string): Promise<AgentProfileEntity> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (existing) return existing;
    const created = AgentProfileEntity.empty(storeId, agentId);
    this.profiles.set(keyOf(storeId, agentId), created);
    return created;
  }

  async upsert(
    storeId: string,
    agentId: string,
    payload: AgentProfileWritePayload,
  ): Promise<AgentProfileEntity> {
    const existing = await this.findByAgentId(storeId, agentId);
    const base = existing ?? AgentProfileEntity.empty(storeId, agentId);
    const provided = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
    const entity = AgentProfileEntity.create(
      { ...base.props, storeId, agentId, ...provided },
      existing?.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async setTwoFactor(
    storeId: string,
    agentId: string,
    enabled: boolean,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = AgentProfileEntity.create(
      { ...existing.props, twoFactorEnabled: enabled },
      existing.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async setGoogleCalendarCredentials(
    storeId: string,
    agentId: string,
    credentials: {
      googleCalendarEnabled: boolean;
      googleRefreshToken: string | null;
      googleCalendarId?: string | null;
    },
  ): Promise<AgentProfileEntity> {
    const existing = await this.ensure(storeId, agentId);
    const entity = AgentProfileEntity.create(
      {
        ...existing.props,
        googleCalendarEnabled: credentials.googleCalendarEnabled,
        googleRefreshToken: credentials.googleRefreshToken,
        googleCalendarId:
          credentials.googleCalendarId?.trim() ||
          existing.googleCalendarId ||
          'primary',
      },
      existing.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async delete(storeId: string, agentId: string): Promise<boolean> {
    await Promise.resolve();
    return this.profiles.delete(keyOf(storeId, agentId));
  }

  async setPhoto(
    storeId: string,
    agentId: string,
    photo: AgentProfilePhoto | null,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = AgentProfileEntity.create(
      { ...existing.props, photo },
      existing.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async upsertLegalDocument(
    storeId: string,
    agentId: string,
    document: AgentLegalDocument,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const others = existing.legalDocuments.filter(
      (doc) => doc.kind !== document.kind,
    );
    const entity = AgentProfileEntity.create(
      { ...existing.props, legalDocuments: [...others, document] },
      existing.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }

  async removeLegalDocument(
    storeId: string,
    agentId: string,
    kind: LegalDocKind,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.findByAgentId(storeId, agentId);
    if (!existing) return null;
    const entity = AgentProfileEntity.create(
      {
        ...existing.props,
        legalDocuments: existing.legalDocuments.filter(
          (doc) => doc.kind !== kind,
        ),
      },
      existing.id,
    );
    this.profiles.set(keyOf(storeId, agentId), entity);
    return entity;
  }
}
