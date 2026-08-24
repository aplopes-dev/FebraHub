import type { AgentDeviceSessionEntity } from '../entities/agent-device-session.entity';

export type AgentDeviceSessionCreatePayload = {
  device: string;
  location: string;
  lastActiveLabel: string;
  isCurrent: boolean;
};

export abstract class AgentDeviceSessionRepository {
  abstract findAll(
    storeId: string,
    agentId: string,
  ): Promise<AgentDeviceSessionEntity[]>;

  abstract findById(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<AgentDeviceSessionEntity | null>;

  abstract create(
    storeId: string,
    agentId: string,
    payload: AgentDeviceSessionCreatePayload,
  ): Promise<AgentDeviceSessionEntity>;

  abstract delete(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<boolean>;

  abstract deleteAllForAgent(storeId: string, agentId: string): Promise<number>;
}
