import { Entity } from '../../../../shared/core/entity';

export type ExpenseProps = {
  storeId: string;
  label: string;
  amountCents: number;
  /** date-only (`YYYY-MM-DD`). */
  date: string;
  category: string;
  createdAt: Date;
};

export class ExpenseEntity extends Entity<ExpenseProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get label(): string {
    return this.props.label;
  }
  get amountCents(): number {
    return this.props.amountCents;
  }
  get date(): string {
    return this.props.date;
  }
  get category(): string {
    return this.props.category;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.label?.trim()) throw new Error('label is required');
    if (this.props.amountCents < 0) {
      throw new Error('amountCents must be >= 0');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.props.date)) {
      throw new Error('date must be YYYY-MM-DD');
    }
  }

  static create(props: ExpenseProps, id?: string): ExpenseEntity {
    const entity = new ExpenseEntity(props, id);
    entity.validate();
    return entity;
  }
}
