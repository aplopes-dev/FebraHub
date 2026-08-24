import type { AgentDeviceSessionEntity } from '../../../../domain/entities/agent-device-session.entity';

export type AgentDeviceSessionHttp = {
  id: string;
  device: string;
  location: string;
  lastActiveLabel: string;
  isCurrent: boolean;
};

export function mapAgentDeviceSessionToHttp(
  session: AgentDeviceSessionEntity,
): AgentDeviceSessionHttp {
  return {
    id: session.id,
    device: session.device,
    location: session.location,
    lastActiveLabel: session.lastActiveLabel,
    isCurrent: session.isCurrent,
  };
}

export function mapAgentPrivacyToHttp(privacy: {
  twoFactorEnabled: boolean;
  sessions: readonly AgentDeviceSessionEntity[];
}) {
  return {
    twoFactorEnabled: privacy.twoFactorEnabled,
    sessions: privacy.sessions.map(mapAgentDeviceSessionToHttp),
  };
}
