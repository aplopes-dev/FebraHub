import { Entity } from '../../../../shared/core/entity';

export type TransactionType = 'SALE' | 'RENTAL';
export type TransactionStatus =
  | 'DRAFT'
  | 'PROPOSAL'
  | 'CONTRACT_SIGNED'
  | 'COMPLETED'
  | 'CANCELLED';
export type SplitSource = 'GLOBAL' | 'AGENT_OVERRIDE' | 'MANUAL';
export type RentalPayoutStatus =
  | 'AWAITING_PAYMENT'
  | 'PAID_BY_TENANT'
  | 'READY_FOR_PAYOUT'
  | 'PAID_TO_LANDLORD';

export type TransactionPaymentMethod =
  | 'pix'
  | 'transfer'
  | 'boleto'
  | 'cash'
  | 'check'
  | 'debit'
  | 'credit'
  | 'financing'
  | 'consortium'
  | 'fgts'
  | 'trade-in'
  | 'other';

export type CommissionOtherSplit = {
  label: string;
  percent: number;
  amountCents: number;
};

export type CommissionSplit = {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others: readonly CommissionOtherSplit[];
  agencyAmountCents: number;
  captorAmountCents: number;
  sellerAmountCents: number;
  totalCommissionCents: number;
};

export type RentalDeduction = {
  label: string;
  amountCents: number;
};

export type RentalConfig = {
  landlordName: string;
  tenantName: string;
  baseRentCents: number;
  condoCents: number;
  iptuCents: number;
  adminFeePercent: number;
  dueDay: number;
  payoutStatus: RentalPayoutStatus;
  receivedCents: number;
  deductions: readonly RentalDeduction[];
  paidAt?: string;
  payoutAt?: string;
};

export type TransactionActivityItem = {
  id: string;
  at: string;
  actorName: string;
  message: string;
};

export type TransactionProps = {
  storeId: string;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  propertyId: string | null;
  propertyName: string;
  leadId: string | null;
  leadName: string | null;
  dealId: string | null;
  captorId: string;
  sellerId: string | null;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  commissionPercent: number;
  split: CommissionSplit;
  splitSource: SplitSource;
  rental: RentalConfig | null;
  activityLog: readonly TransactionActivityItem[];
  createdAt: Date;
  updatedAt: Date;
};

export class TransactionEntity extends Entity<TransactionProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get type(): TransactionType {
    return this.props.type;
  }
  get status(): TransactionStatus {
    return this.props.status;
  }
  get title(): string {
    return this.props.title;
  }
  get propertyId(): string | null {
    return this.props.propertyId;
  }
  get propertyName(): string {
    return this.props.propertyName;
  }
  get leadId(): string | null {
    return this.props.leadId;
  }
  get leadName(): string | null {
    return this.props.leadName;
  }
  get dealId(): string | null {
    return this.props.dealId;
  }
  get captorId(): string {
    return this.props.captorId;
  }
  get sellerId(): string | null {
    return this.props.sellerId;
  }
  get grossValueCents(): number {
    return this.props.grossValueCents;
  }
  get paymentMethod(): TransactionPaymentMethod {
    return this.props.paymentMethod;
  }
  get commissionPercent(): number {
    return this.props.commissionPercent;
  }
  get split(): CommissionSplit {
    return this.props.split;
  }
  get splitSource(): SplitSource {
    return this.props.splitSource;
  }
  get rental(): RentalConfig | null {
    return this.props.rental;
  }
  get activityLog(): readonly TransactionActivityItem[] {
    return this.props.activityLog;
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
    if (!this.props.captorId?.trim()) throw new Error('captorId is required');
    if (this.props.grossValueCents < 0) {
      throw new Error('grossValueCents must be >= 0');
    }
    if (!this.props.paymentMethod) {
      throw new Error('paymentMethod is required');
    }
  }

  with(patch: Partial<TransactionProps>): TransactionEntity {
    return TransactionEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: TransactionProps, id?: string): TransactionEntity {
    const entity = new TransactionEntity(props, id);
    entity.validate();
    return entity;
  }
}
