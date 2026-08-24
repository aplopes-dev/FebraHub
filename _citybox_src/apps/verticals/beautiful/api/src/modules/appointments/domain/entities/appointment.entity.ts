import { Entity } from '../../../../shared/core/entity';
import { AppointmentValidatorFactory } from '../factories/appointment-validator.factory';
import type {
  AppointmentServiceLine,
  AppointmentStatus,
} from '../appointment.types';

export interface AppointmentProps {
  storeId: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  clientNotes?: string | null;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  totalPrice: number;
  services: AppointmentServiceLine[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class AppointmentEntity extends Entity<AppointmentProps> {
  private constructor(props: AppointmentProps, id?: string) {
    super(
      {
        ...props,
        clientNotes: props.clientNotes ?? null,
        categoryId: props.categoryId ?? null,
        categoryName: props.categoryName ?? null,
        categoryColor: props.categoryColor ?? null,
        services: props.services ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    AppointmentValidatorFactory.create().validate(this.props);
  }

  public static create(
    props: AppointmentProps,
    id?: string,
  ): AppointmentEntity {
    return new AppointmentEntity(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get clientName(): string | undefined {
    return this.props.clientName;
  }

  get clientPhone(): string | undefined {
    return this.props.clientPhone;
  }

  get categoryId(): string | null {
    return this.props.categoryId ?? null;
  }

  get categoryName(): string | null {
    return this.props.categoryName ?? null;
  }

  get categoryColor(): string | null {
    return this.props.categoryColor ?? null;
  }

  get clientNotes(): string | null {
    return this.props.clientNotes ?? null;
  }

  get startAt(): Date {
    return this.props.startAt;
  }

  get endAt(): Date {
    return this.props.endAt;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get totalPrice(): number {
    return this.props.totalPrice;
  }

  get services(): AppointmentServiceLine[] {
    return this.props.services;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public updateStatus(status: AppointmentStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
    this.validate();
  }

  /** Atualiza horário, serviços, valor, categoria e observações (cliente permanece o mesmo). */
  public updateDetails(input: {
    clientNotes?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    categoryColor?: string | null;
    startAt: Date;
    endAt: Date;
    totalPrice: number;
    services: AppointmentServiceLine[];
  }): void {
    if (input.categoryId !== undefined) {
      this.props.categoryId = input.categoryId;
      this.props.categoryName =
        input.categoryName === undefined
          ? (this.props.categoryName ?? null)
          : input.categoryName;
      this.props.categoryColor =
        input.categoryColor === undefined
          ? (this.props.categoryColor ?? null)
          : input.categoryColor;
    }
    this.props.clientNotes =
      input.clientNotes === undefined
        ? (this.props.clientNotes ?? null)
        : input.clientNotes;
    this.props.startAt = input.startAt;
    this.props.endAt = input.endAt;
    this.props.totalPrice = input.totalPrice;
    this.props.services = input.services;
    this.props.updatedAt = new Date();
    this.validate();
  }
}
