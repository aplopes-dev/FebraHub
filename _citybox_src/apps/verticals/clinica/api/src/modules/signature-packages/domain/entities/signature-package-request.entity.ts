import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type SignaturePackageRequestStatus =
  | 'pending'
  | 'liberado'
  | 'cancelado';

export type SignaturePackageRequestProps = {
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: SignaturePackageRequestStatus;
  createdAt: Date;
  liberatedAt: Date | null;
};

export class SignaturePackageRequest extends Entity<SignaturePackageRequestProps> {
  constructor(props: SignaturePackageRequestProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // no-op: validated at use-case / HTTP boundary
  }

  public static create(
    props: Optional<
      SignaturePackageRequestProps,
      'status' | 'createdAt' | 'liberatedAt'
    >,
    id?: string,
  ): SignaturePackageRequest {
    return new SignaturePackageRequest(
      {
        ...props,
        status: props.status ?? 'pending',
        createdAt: props.createdAt ?? new Date(),
        liberatedAt: props.liberatedAt ?? null,
      },
      id,
    );
  }

  public static with(
    props: SignaturePackageRequestProps,
    id: string,
  ): SignaturePackageRequest {
    return new SignaturePackageRequest(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get packageId(): string {
    return this.props.packageId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get priceCents(): number {
    return this.props.priceCents;
  }

  get status(): SignaturePackageRequestStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get liberatedAt(): Date | null {
    return this.props.liberatedAt;
  }

  public withLiberated(at: Date = new Date()): SignaturePackageRequest {
    return SignaturePackageRequest.create(
      {
        storeId: this.storeId,
        packageId: this.packageId,
        quantity: this.quantity,
        priceCents: this.priceCents,
        status: 'liberado',
        createdAt: this.createdAt,
        liberatedAt: at,
      },
      this.id,
    );
  }

  public withCancelled(): SignaturePackageRequest {
    return SignaturePackageRequest.create(
      {
        storeId: this.storeId,
        packageId: this.packageId,
        quantity: this.quantity,
        priceCents: this.priceCents,
        status: 'cancelado',
        createdAt: this.createdAt,
        liberatedAt: this.liberatedAt,
      },
      this.id,
    );
  }
}
