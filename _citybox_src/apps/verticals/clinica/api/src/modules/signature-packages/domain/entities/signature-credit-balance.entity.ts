import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { SignatureCreditsInsufficientError } from '../errors/signature-credits-insufficient.error';

export type SignatureCreditBalanceProps = {
  storeId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export class SignatureCreditBalance extends Entity<SignatureCreditBalanceProps> {
  constructor(props: SignatureCreditBalanceProps, id?: string) {
    // storeId is the primary key — reuse as Entity id
    super(props, id ?? props.storeId);
  }

  protected validate(): void {
    // no-op: balance is a simple integer ledger
  }

  public static create(
    props: Optional<
      SignatureCreditBalanceProps,
      'createdAt' | 'updatedAt'
    >,
  ): SignatureCreditBalance {
    const now = new Date();
    return new SignatureCreditBalance({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  public static with(
    props: SignatureCreditBalanceProps,
  ): SignatureCreditBalance {
    return new SignatureCreditBalance(props);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get balance(): number {
    return this.props.balance;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public withAddedCredits(quantity: number): SignatureCreditBalance {
    return SignatureCreditBalance.create({
      storeId: this.storeId,
      balance: this.balance + quantity,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public withDebitedCredits(quantity: number): SignatureCreditBalance {
    if (this.balance < quantity) {
      throw new SignatureCreditsInsufficientError(
        SignatureCreditBalance.name,
        this.balance,
        quantity,
      );
    }
    return SignatureCreditBalance.create({
      storeId: this.storeId,
      balance: this.balance - quantity,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
