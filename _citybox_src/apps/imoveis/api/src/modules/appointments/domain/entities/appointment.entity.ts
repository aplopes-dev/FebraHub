import { Entity } from '../../../../shared/core/entity';
import type { ApiAppointmentKind } from '../mappers/appointment-enum.mapper';

export type AppointmentProps = {
  storeId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  kind: ApiAppointmentKind;
  agentId: string;
  done: boolean;
  leadId: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  leadPhotoUrl: string | null;
  propertyId: string | null;
  googleEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class AppointmentEntity extends Entity<AppointmentProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string {
    return this.props.description;
  }
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get endsAt(): Date {
    return this.props.endsAt;
  }
  get location(): string {
    return this.props.location;
  }
  get kind(): ApiAppointmentKind {
    return this.props.kind;
  }
  get agentId(): string {
    return this.props.agentId;
  }
  get done(): boolean {
    return this.props.done;
  }
  get leadId(): string | null {
    return this.props.leadId;
  }
  get leadName(): string | null {
    return this.props.leadName;
  }
  get leadEmail(): string | null {
    return this.props.leadEmail;
  }
  get leadPhone(): string | null {
    return this.props.leadPhone;
  }
  get leadPhotoUrl(): string | null {
    return this.props.leadPhotoUrl;
  }
  get propertyId(): string | null {
    return this.props.propertyId;
  }
  get googleEventId(): string | null {
    return this.props.googleEventId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.title?.trim()) throw new Error('title is required');
    if (!this.props.agentId?.trim()) throw new Error('agentId is required');
    if (
      !(this.props.startsAt instanceof Date) ||
      Number.isNaN(this.props.startsAt.getTime())
    ) {
      throw new Error('startsAt is required');
    }
    if (
      !(this.props.endsAt instanceof Date) ||
      Number.isNaN(this.props.endsAt.getTime())
    ) {
      throw new Error('endsAt is required');
    }
  }

  with(patch: Partial<AppointmentProps>): AppointmentEntity {
    return AppointmentEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: AppointmentProps, id?: string): AppointmentEntity {
    const entity = new AppointmentEntity(props, id);
    entity.validate();
    return entity;
  }
}
