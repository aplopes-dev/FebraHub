import { Entity } from '../../../../shared/core/entity';

export type AgentDeviceSessionProps = {
  storeId: string;
  agentId: string;
  device: string;
  location: string;
  /** Rótulo exibido no web (“Agora”, “Há 2 dias”). */
  lastActiveLabel: string;
  isCurrent: boolean;
};

export class AgentDeviceSessionEntity extends Entity<AgentDeviceSessionProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get agentId(): string {
    return this.props.agentId;
  }
  get device(): string {
    return this.props.device;
  }
  get location(): string {
    return this.props.location;
  }
  get lastActiveLabel(): string {
    return this.props.lastActiveLabel;
  }
  get isCurrent(): boolean {
    return this.props.isCurrent;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.agentId) throw new Error('agentId is required');
    if (!this.props.device) throw new Error('device is required');
  }

  static create(
    props: AgentDeviceSessionProps,
    id?: string,
  ): AgentDeviceSessionEntity {
    const entity = new AgentDeviceSessionEntity({ ...props }, id);
    entity.validate();
    return entity;
  }

  /** Sessão criada na primeira leitura do painel de privacidade. */
  static currentDefault(
    storeId: string,
    agentId: string,
  ): AgentDeviceSessionEntity {
    return AgentDeviceSessionEntity.create({
      storeId,
      agentId,
      device: 'Sessão atual',
      location: '—',
      lastActiveLabel: 'Agora',
      isCurrent: true,
    });
  }
}
