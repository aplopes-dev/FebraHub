import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type { AppointmentStatus } from '../../../shared/domain/appointment-types';
import { EDITABLE_APPOINTMENT_STATUSES } from '../../../shared/domain/appointment-types';
import type {
  AppointmentChannel,
  InsuranceType,
  ReturnOption,
} from '../../../shared/domain/scheduling-enums';

export type AppointmentProps = {
  storeId: string;
  patientId: string;
  professionalId: string;
  procedureId: string | null;
  roomId: string | null;
  categoryId: string | null;
  status: AppointmentStatus;
  channel: AppointmentChannel | null;
  confirmationSource: 'manual' | 'whatsapp' | null;
  insuranceType: InsuranceType;
  startAt: Date;
  endAt: Date;
  durationMin: number;
  notes: string | null;
  returnOption: ReturnOption | null;
  returnDate: Date | null;
  returnReason: string | null;
  fitInId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateAppointmentInput = {
  patientId?: string;
  professionalId?: string;
  procedureId?: string | null;
  roomId?: string | null;
  categoryId?: string | null;
  channel?: AppointmentChannel | null;
  insuranceType?: InsuranceType;
  startAt?: Date;
  endAt?: Date;
  durationMin?: number;
  notes?: string | null;
  returnOption?: ReturnOption | null;
  returnDate?: Date | null;
  returnReason?: string | null;
};

export class Appointment extends Entity<AppointmentProps> {
  constructor(props: AppointmentProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<
      AppointmentProps,
      'createdAt' | 'updatedAt' | 'status' | 'confirmationSource'
    >,
    id?: string,
  ): Appointment {
    return new Appointment(
      {
        ...props,
        status: props.status ?? 'scheduled',
        confirmationSource: props.confirmationSource ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: AppointmentProps, id: string): Appointment {
    return new Appointment(props, id);
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
  get procedureId() {
    return this.props.procedureId;
  }
  get roomId() {
    return this.props.roomId;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get status() {
    return this.props.status;
  }
  get channel() {
    return this.props.channel;
  }
  get confirmationSource() {
    return this.props.confirmationSource;
  }
  get insuranceType() {
    return this.props.insuranceType;
  }
  get startAt() {
    return this.props.startAt;
  }
  get endAt() {
    return this.props.endAt;
  }
  get durationMin() {
    return this.props.durationMin;
  }
  get notes() {
    return this.props.notes;
  }
  get returnOption() {
    return this.props.returnOption;
  }
  get returnDate() {
    return this.props.returnDate;
  }
  get returnReason() {
    return this.props.returnReason;
  }
  get fitInId() {
    return this.props.fitInId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  isEditable(): boolean {
    return EDITABLE_APPOINTMENT_STATUSES.includes(this.props.status);
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  updateStatus(
    status: AppointmentStatus,
    confirmationSource?: 'manual' | 'whatsapp' | null,
  ): void {
    this.props.status = status;
    if (confirmationSource !== undefined) {
      this.props.confirmationSource = confirmationSource;
    }
    this.touch();
  }

  update(input: UpdateAppointmentInput): void {
    if (input.patientId !== undefined) this.props.patientId = input.patientId;
    if (input.professionalId !== undefined) {
      this.props.professionalId = input.professionalId;
    }
    if (input.procedureId !== undefined)
      this.props.procedureId = input.procedureId;
    if (input.roomId !== undefined) this.props.roomId = input.roomId;
    if (input.categoryId !== undefined)
      this.props.categoryId = input.categoryId;
    if (input.channel !== undefined) this.props.channel = input.channel;
    if (input.insuranceType !== undefined) {
      this.props.insuranceType = input.insuranceType;
    }
    if (input.startAt !== undefined) this.props.startAt = input.startAt;
    if (input.endAt !== undefined) this.props.endAt = input.endAt;
    if (input.durationMin !== undefined) {
      this.props.durationMin = input.durationMin;
    }
    if (input.notes !== undefined) this.props.notes = input.notes;
    if (input.returnOption !== undefined) {
      this.props.returnOption = input.returnOption;
    }
    if (input.returnDate !== undefined)
      this.props.returnDate = input.returnDate;
    if (input.returnReason !== undefined) {
      this.props.returnReason = input.returnReason;
    }
    this.touch();
  }
}
