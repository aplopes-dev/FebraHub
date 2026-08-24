import { randomUUID } from 'crypto';
import { Entity } from '../../../../shared/core/entity';

export type FiscalSequenceNumberChangeProps = {
  sequenceId: string;
  companyId: string;
  previousNumber: bigint;
  newNumber: bigint;
  changedByUserId: string;
  changedByActor: string | null;
  changedAt: Date;
};

/// Auditoria append-only da alteração manual do número atual (spec erp/011,
/// FR-004): quem, quando, de quanto para quanto.
export class FiscalSequenceNumberChange extends Entity<FiscalSequenceNumberChangeProps> {
  constructor(props: FiscalSequenceNumberChangeProps, id: string) {
    super(props, id);
  }

  /// Log append-only: sem invariantes além dos tipos.
  protected validate(): void {}

  public static create(
    props: Omit<FiscalSequenceNumberChangeProps, 'changedAt'> & {
      changedAt?: Date;
    },
  ): FiscalSequenceNumberChange {
    return new FiscalSequenceNumberChange(
      { ...props, changedAt: props.changedAt ?? new Date() },
      randomUUID(),
    );
  }

  get sequenceId() {
    return this.props.sequenceId;
  }
  get companyId() {
    return this.props.companyId;
  }
  get previousNumber() {
    return this.props.previousNumber;
  }
  get newNumber() {
    return this.props.newNumber;
  }
  get changedByUserId() {
    return this.props.changedByUserId;
  }
  get changedByActor() {
    return this.props.changedByActor;
  }
  get changedAt() {
    return this.props.changedAt;
  }
}
