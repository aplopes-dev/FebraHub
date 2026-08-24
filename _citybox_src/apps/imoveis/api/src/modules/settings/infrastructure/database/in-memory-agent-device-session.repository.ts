import { AgentDeviceSessionEntity } from '../../domain/entities/agent-device-session.entity';
import {
  AgentDeviceSessionRepository,
  type AgentDeviceSessionCreatePayload,
} from '../../domain/repositories/agent-device-session.repository.interface';

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryAgentDeviceSessionRepository extends AgentDeviceSessionRepository {
  private readonly sessions = new Map<string, AgentDeviceSessionEntity>();

  async findAll(
    storeId: string,
    agentId: string,
  ): Promise<AgentDeviceSessionEntity[]> {
    await Promise.resolve();
    return [...this.sessions.values()].filter(
      (session) => session.storeId === storeId && session.agentId === agentId,
    );
  }

  async findById(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<AgentDeviceSessionEntity | null> {
    const all = await this.findAll(storeId, agentId);
    return all.find((session) => session.id === sessionId) ?? null;
  }

  async create(
    storeId: string,
    agentId: string,
    payload: AgentDeviceSessionCreatePayload,
  ): Promise<AgentDeviceSessionEntity> {
    await Promise.resolve();
    const entity = AgentDeviceSessionEntity.create({
      storeId,
      agentId,
      ...payload,
    });
    this.sessions.set(entity.id, entity);
    return entity;
  }

  async delete(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<boolean> {
    const existing = await this.findById(storeId, agentId, sessionId);
    if (!existing) return false;
    return this.sessions.delete(sessionId);
  }

  async deleteAllForAgent(storeId: string, agentId: string): Promise<number> {
    const all = await this.findAll(storeId, agentId);
    for (const session of all) this.sessions.delete(session.id);
    return all.length;
  }
}
