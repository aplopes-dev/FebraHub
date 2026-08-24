import { Entity } from '../../../../shared/core/entity';
import { ServiceValidatorFactory } from '../factories/service-validator.factory';

export interface ServiceProps {
  storeId: string;
  name: string;
  categories?: string[];
  durationMinutes: number;
  price: number;
  description?: string | null;
  active: boolean;
  professionalIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceEntity extends Entity<ServiceProps> {
  private constructor(props: ServiceProps, id?: string) {
    super(
      {
        ...props,
        categories: props.categories ?? [],
        professionalIds: props.professionalIds ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    ServiceValidatorFactory.create().validate(this.props);
  }

  public static create(props: ServiceProps, id?: string): ServiceEntity {
    return new ServiceEntity(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get categories(): string[] {
    return this.props.categories ?? [];
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get price(): number {
    return this.props.price;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get active(): boolean {
    return this.props.active;
  }

  get professionalIds(): string[] {
    return this.props.professionalIds ?? [];
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public update(
    data: Partial<
      Omit<
        ServiceProps,
        'storeId' | 'createdAt' | 'updatedAt' | 'professionalIds'
      >
    >,
  ): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.categories !== undefined) this.props.categories = data.categories;
    if (data.durationMinutes !== undefined)
      this.props.durationMinutes = data.durationMinutes;
    if (data.price !== undefined) this.props.price = data.price;
    if (data.description !== undefined)
      this.props.description = data.description;
    if (data.active !== undefined) this.props.active = data.active;
    this.props.updatedAt = new Date();
    this.validate();
  }

  public toggleActive(): void {
    this.props.active = !this.props.active;
    this.props.updatedAt = new Date();
  }
}
