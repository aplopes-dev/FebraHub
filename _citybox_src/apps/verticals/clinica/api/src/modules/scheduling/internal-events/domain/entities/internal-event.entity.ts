import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type {
  InternalEventAvailability,
  InternalEventPrivacy,
  RecurrenceEnd,
  RecurrenceType,
} from '../../../shared/domain/scheduling-enums';

export type InternalEventProps = {
  storeId: string;
  professionalId: string;
  roomId: string | null;
  title: string;
  description: string | null;
  allDay: boolean;
  startAt: Date;
  endAt: Date;
  recurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEnd: RecurrenceEnd | null;
  recurrenceEndDate: Date | null;
  availability: InternalEventAvailability;
  privacy: InternalEventPrivacy;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateInternalEventInput = {
  roomId?: string | null;
  title?: string;
  description?: string | null;
  allDay?: boolean;
  startAt?: Date;
  endAt?: Date;
  recurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceEnd?: RecurrenceEnd | null;
  recurrenceEndDate?: Date | null;
  availability?: InternalEventAvailability;
  privacy?: InternalEventPrivacy;
};

export class InternalEvent extends Entity<InternalEventProps> {
  constructor(props: InternalEventProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<
      InternalEventProps,
      | 'createdAt'
      | 'updatedAt'
      | 'allDay'
      | 'recurring'
      | 'availability'
      | 'privacy'
      | 'description'
      | 'roomId'
      | 'recurrenceType'
      | 'recurrenceEnd'
      | 'recurrenceEndDate'
    >,
    id?: string,
  ): InternalEvent {
    return new InternalEvent(
      {
        ...props,
        allDay: props.allDay ?? false,
        recurring: props.recurring ?? false,
        availability: props.availability ?? 'busy',
        privacy: props.privacy ?? 'public',
        description: props.description ?? null,
        roomId: props.roomId ?? null,
        recurrenceType: props.recurrenceType ?? null,
        recurrenceEnd: props.recurrenceEnd ?? null,
        recurrenceEndDate: props.recurrenceEndDate ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: InternalEventProps, id: string): InternalEvent {
    return new InternalEvent(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get roomId() {
    return this.props.roomId;
  }
  get title() {
    return this.props.title;
  }
  get description() {
    return this.props.description;
  }
  get allDay() {
    return this.props.allDay;
  }
  get startAt() {
    return this.props.startAt;
  }
  get endAt() {
    return this.props.endAt;
  }
  get recurring() {
    return this.props.recurring;
  }
  get recurrenceType() {
    return this.props.recurrenceType;
  }
  get recurrenceEnd() {
    return this.props.recurrenceEnd;
  }
  get recurrenceEndDate() {
    return this.props.recurrenceEndDate;
  }
  get availability() {
    return this.props.availability;
  }
  get privacy() {
    return this.props.privacy;
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

  update(input: UpdateInternalEventInput): void {
    if (input.roomId !== undefined) this.props.roomId = input.roomId;
    if (input.title !== undefined) this.props.title = input.title.trim();
    if (input.description !== undefined)
      this.props.description = input.description;
    if (input.allDay !== undefined) this.props.allDay = input.allDay;
    if (input.startAt !== undefined) this.props.startAt = input.startAt;
    if (input.endAt !== undefined) this.props.endAt = input.endAt;
    if (input.recurring !== undefined) this.props.recurring = input.recurring;
    if (input.recurrenceType !== undefined) {
      this.props.recurrenceType = input.recurrenceType;
    }
    if (input.recurrenceEnd !== undefined) {
      this.props.recurrenceEnd = input.recurrenceEnd;
    }
    if (input.recurrenceEndDate !== undefined) {
      this.props.recurrenceEndDate = input.recurrenceEndDate;
    }
    if (input.availability !== undefined) {
      this.props.availability = input.availability;
    }
    if (input.privacy !== undefined) this.props.privacy = input.privacy;
    this.touch();
  }
}
