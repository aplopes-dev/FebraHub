import { Entity } from '../../../../shared/core/entity';

export type DealStatus = 'active' | 'won' | 'cancelled';

export type DealStage =
  | 'awaiting_property'
  | 'property_selected'
  | 'contract_sent'
  | 'contract_signed'
  | 'payment_confirmed'
  | 'handover';

export type DealType = 'SALE' | 'RENTAL';

export type DealProps = {
  storeId: string;
  leadId: string;
  propertyId: string | null;
  propertyName: string;
  leadName: string | null;
  type: DealType | null;
  status: DealStatus;
  stage: DealStage;
  title: string;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class DealEntity extends Entity<DealProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get leadId(): string {
    return this.props.leadId;
  }
  get propertyId(): string | null {
    return this.props.propertyId;
  }
  get propertyName(): string {
    return this.props.propertyName;
  }
  get leadName(): string | null {
    return this.props.leadName;
  }
  get type(): DealType | null {
    return this.props.type;
  }
  get status(): DealStatus {
    return this.props.status;
  }
  get stage(): DealStage {
    return this.props.stage;
  }
  get title(): string {
    return this.props.title;
  }
  get agentId(): string | null {
    return this.props.agentId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.leadId) throw new Error('leadId is required');
  }

  with(patch: Partial<DealProps>): DealEntity {
    return DealEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: DealProps, id?: string): DealEntity {
    const entity = new DealEntity(props, id);
    entity.validate();
    return entity;
  }
}
