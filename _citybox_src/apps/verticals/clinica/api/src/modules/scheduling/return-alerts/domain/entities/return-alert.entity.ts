import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type { ReturnAlertSource } from '../../../shared/domain/scheduling-enums';

export type ReturnAlertProps = {
  storeId: string;
  patientId: string;
  professionalId: string;
  appointmentId: string | null;
  dueDate: Date;
  reason: string | null;
  source: ReturnAlertSource;
  createdAt: Date;
  updatedAt: Date;
};

export class ReturnAlert extends Entity<ReturnAlertProps> {
  constructor(props: ReturnAlertProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<ReturnAlertProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): ReturnAlert {
    return new ReturnAlert(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: ReturnAlertProps, id: string): ReturnAlert {
    return new ReturnAlert(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get appointmentId() {
    return this.props.appointmentId;
  }
  get dueDate() {
    return this.props.dueDate;
  }
  get reason() {
    return this.props.reason;
  }
  get source() {
    return this.props.source;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  updateFromAppointment(input: {
    dueDate: Date;
    reason: string | null;
    appointmentId: string;
  }): void {
    this.props.dueDate = input.dueDate;
    this.props.reason = input.reason;
    this.props.appointmentId = input.appointmentId;
    this.props.source = 'auto';
    this.touch();
  }
}
