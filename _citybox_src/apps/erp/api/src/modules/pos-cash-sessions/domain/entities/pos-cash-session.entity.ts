import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type PosCashSessionStatus = 'open' | 'closed';

export type PosCashSessionProps = {
  organizationId: string;
  branchId: string;
  posTerminalId: string;
  status: PosCashSessionStatus;
  openedAt: Date;
  closedAt: Date | null;
  openedByUserId: string;
  openedByName: string;
  openingFloatCents: number;
  countedCashCents: number | null;
  countedCreditCents: number | null;
  countedDebitCents: number | null;
  countedVoucherCents: number | null;
  countedOtherCents: number | null;
  expectedCashCents: number | null;
  differenceCashCents: number | null;
  declaredReceiptsCents: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePosCashSessionProps = Optional<
  PosCashSessionProps,
  | 'status'
  | 'openedAt'
  | 'closedAt'
  | 'countedCashCents'
  | 'countedCreditCents'
  | 'countedDebitCents'
  | 'countedVoucherCents'
  | 'countedOtherCents'
  | 'expectedCashCents'
  | 'differenceCashCents'
  | 'declaredReceiptsCents'
  | 'createdAt'
  | 'updatedAt'
>;

export type CloseCashSessionInput = {
  countedCashCents: number;
  countedCreditCents: number;
  countedDebitCents: number;
  countedVoucherCents: number;
  countedOtherCents: number;
  expectedCashCents: number;
};

/**
 * Turno de caixa do PDV (abrir → movimentos/vendas → fechar).
 * Uma sessão `open` por terminal (enforçado no use case).
 */
export class PosCashSession extends Entity<PosCashSessionProps> {
  constructor(props: PosCashSessionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.openingFloatCents < 0) {
      throw new Error('openingFloatCents must be >= 0');
    }
    if (this.props.status !== 'open' && this.props.status !== 'closed') {
      throw new Error(`invalid PosCashSession status: ${this.props.status}`);
    }
  }

  public static create(
    props: CreatePosCashSessionProps,
    id?: string,
  ): PosCashSession {
    const now = new Date();
    return new PosCashSession(
      {
        organizationId: props.organizationId,
        branchId: props.branchId,
        posTerminalId: props.posTerminalId,
        status: props.status ?? 'open',
        openedAt: props.openedAt ?? now,
        closedAt: props.closedAt ?? null,
        openedByUserId: props.openedByUserId,
        openedByName: props.openedByName.trim() || 'Operador',
        openingFloatCents: props.openingFloatCents,
        countedCashCents: props.countedCashCents ?? null,
        countedCreditCents: props.countedCreditCents ?? null,
        countedDebitCents: props.countedDebitCents ?? null,
        countedVoucherCents: props.countedVoucherCents ?? null,
        countedOtherCents: props.countedOtherCents ?? null,
        expectedCashCents: props.expectedCashCents ?? null,
        differenceCashCents: props.differenceCashCents ?? null,
        declaredReceiptsCents: props.declaredReceiptsCents ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: PosCashSessionProps, id: string): PosCashSession {
    return new PosCashSession(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get branchId() {
    return this.props.branchId;
  }
  get posTerminalId() {
    return this.props.posTerminalId;
  }
  get status() {
    return this.props.status;
  }
  get openedAt() {
    return this.props.openedAt;
  }
  get closedAt() {
    return this.props.closedAt;
  }
  get openedByUserId() {
    return this.props.openedByUserId;
  }
  get openedByName() {
    return this.props.openedByName;
  }
  get openingFloatCents() {
    return this.props.openingFloatCents;
  }
  get countedCashCents() {
    return this.props.countedCashCents;
  }
  get countedCreditCents() {
    return this.props.countedCreditCents;
  }
  get countedDebitCents() {
    return this.props.countedDebitCents;
  }
  get countedVoucherCents() {
    return this.props.countedVoucherCents;
  }
  get countedOtherCents() {
    return this.props.countedOtherCents;
  }
  get expectedCashCents() {
    return this.props.expectedCashCents;
  }
  get differenceCashCents() {
    return this.props.differenceCashCents;
  }
  get declaredReceiptsCents() {
    return this.props.declaredReceiptsCents;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get isOpen() {
    return this.props.status === 'open';
  }

  close(input: CloseCashSessionInput): PosCashSession {
    const declaredReceiptsCents =
      input.countedCashCents +
      input.countedCreditCents +
      input.countedDebitCents +
      input.countedVoucherCents +
      input.countedOtherCents;
    const now = new Date();
    return PosCashSession.with(
      {
        ...this.props,
        status: 'closed',
        closedAt: now,
        countedCashCents: input.countedCashCents,
        countedCreditCents: input.countedCreditCents,
        countedDebitCents: input.countedDebitCents,
        countedVoucherCents: input.countedVoucherCents,
        countedOtherCents: input.countedOtherCents,
        expectedCashCents: input.expectedCashCents,
        differenceCashCents: input.countedCashCents - input.expectedCashCents,
        declaredReceiptsCents,
        updatedAt: now,
      },
      this.id,
    );
  }
}
