import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type {
  FitInShift,
  FitInStatus,
} from '../../../shared/domain/scheduling-enums';

export type FitInProps = {
  storeId: string;
  patientId: string;
  professionalId: string | null;
  categoryId: string | null;
  fitInDate: Date | null;
  anyDate: boolean;
  shifts: FitInShift[];
  planName: string | null;
  observation: string | null;
  isUrgent: boolean;
  status: FitInStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateFitInInput = {
  professionalId?: string | null;
  categoryId?: string | null;
  fitInDate?: Date | null;
  anyDate?: boolean;
  shifts?: FitInShift[];
  planName?: string | null;
  observation?: string | null;
  isUrgent?: boolean;
  status?: FitInStatus;
};

export class FitIn extends Entity<FitInProps> {
  constructor(props: FitInProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  static create(
    props: Optional<
      FitInProps,
      'createdAt' | 'updatedAt' | 'status' | 'anyDate' | 'isUrgent'
    >,
    id?: string,
  ): FitIn {
    return new FitIn(
      {
        ...props,
        status: props.status ?? 'pending',
        anyDate: props.anyDate ?? false,
        isUrgent: props.isUrgent ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: FitInProps, id: string): FitIn {
    return new FitIn(props, id);
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
  get categoryId() {
    return this.props.categoryId;
  }
  get fitInDate() {
    return this.props.fitInDate;
  }
  get anyDate() {
    return this.props.anyDate;
  }
  get shifts() {
    return this.props.shifts;
  }
  get planName() {
    return this.props.planName;
  }
  get observation() {
    return this.props.observation;
  }
  get isUrgent() {
    return this.props.isUrgent;
  }
  get status() {
    return this.props.status;
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

  markScheduled(): void {
    this.props.status = 'scheduled';
    this.touch();
  }

  update(input: UpdateFitInInput): void {
    if (input.professionalId !== undefined) {
      this.props.professionalId = input.professionalId;
    }
    if (input.categoryId !== undefined)
      this.props.categoryId = input.categoryId;
    if (input.fitInDate !== undefined) this.props.fitInDate = input.fitInDate;
    if (input.anyDate !== undefined) this.props.anyDate = input.anyDate;
    if (input.shifts !== undefined) this.props.shifts = input.shifts;
    if (input.planName !== undefined) this.props.planName = input.planName;
    if (input.observation !== undefined) {
      this.props.observation = input.observation;
    }
    if (input.isUrgent !== undefined) this.props.isUrgent = input.isUrgent;
    if (input.status !== undefined) this.props.status = input.status;
    this.touch();
  }
}
