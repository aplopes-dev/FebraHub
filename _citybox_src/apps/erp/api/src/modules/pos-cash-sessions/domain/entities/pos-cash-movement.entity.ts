import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type PosCashMovementType = 'withdrawal' | 'reinforcement';

export type PosCashMovementProps = {
  organizationId: string;
  sessionId: string;
  type: PosCashMovementType;
  amountCents: number;
  reason: string;
  operation: string;
  operatorUserId: string;
  operatorName: string;
  authorizedByUserId: string | null;
  authorizedByName: string | null;
  createdAt: Date;
};

type CreatePosCashMovementProps = Optional<
  PosCashMovementProps,
  'reason' | 'authorizedByUserId' | 'authorizedByName' | 'createdAt'
>;

export class PosCashMovement extends Entity<PosCashMovementProps> {
  constructor(props: PosCashMovementProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.amountCents <= 0) {
      throw new Error('amountCents must be > 0');
    }
    if (
      this.props.type !== 'withdrawal' &&
      this.props.type !== 'reinforcement'
    ) {
      throw new Error(`invalid PosCashMovement type: ${this.props.type}`);
    }
  }

  public static create(
    props: CreatePosCashMovementProps,
    id?: string,
  ): PosCashMovement {
    return new PosCashMovement(
      {
        organizationId: props.organizationId,
        sessionId: props.sessionId,
        type: props.type,
        amountCents: props.amountCents,
        reason: props.reason?.trim() ?? '',
        operation: props.operation,
        operatorUserId: props.operatorUserId,
        operatorName: props.operatorName.trim() || 'Operador',
        authorizedByUserId: props.authorizedByUserId ?? null,
        authorizedByName: props.authorizedByName ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PosCashMovementProps, id: string): PosCashMovement {
    return new PosCashMovement(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get sessionId() {
    return this.props.sessionId;
  }
  get type() {
    return this.props.type;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get reason() {
    return this.props.reason;
  }
  get operation() {
    return this.props.operation;
  }
  get operatorUserId() {
    return this.props.operatorUserId;
  }
  get operatorName() {
    return this.props.operatorName;
  }
  get authorizedByUserId() {
    return this.props.authorizedByUserId;
  }
  get authorizedByName() {
    return this.props.authorizedByName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
