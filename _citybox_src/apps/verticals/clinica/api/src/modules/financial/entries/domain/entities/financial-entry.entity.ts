import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type FinancialEntryType = 'income' | 'expense';
export type FinancialEntryStatus =
  | 'pending'
  | 'paid'
  | 'received'
  | 'cancelled';
export type FinancialEntrySource =
  | 'manual'
  | 'budget_approve'
  | 'avulso_debit';

export type FinancialEntryReceiveDetail = {
  paymentMethod: string;
  accountId: string;
  paidValueCents: number;
  paymentType?: string;
  observation?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};

export type FinancialEntryProps = {
  storeId: string;
  type: FinancialEntryType;
  status: FinancialEntryStatus;
  source: FinancialEntrySource;
  description: string;
  valueCents: number;
  dueDate: Date;
  paidAt: Date | null;
  paidValueCents: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  observation: string | null;
  accountId: string | null;
  expenseCategoryId: string | null;
  incomeCategoryId: string | null;
  patientId: string | null;
  budgetId: string | null;
  installmentIndex: number | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  recurrenceGroupId: string | null;
  debitDetail: Record<string, unknown> | null;
  receiveDetail: FinancialEntryReceiveDetail | Record<string, unknown> | null;
  receiptObjectKey: string | null;
  cancelledById: string | null;
  cancelledByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class FinancialEntry extends Entity<FinancialEntryProps> {
  constructor(props: FinancialEntryProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      FinancialEntryProps,
      | 'status'
      | 'paidAt'
      | 'paidValueCents'
      | 'paymentMethod'
      | 'paymentType'
      | 'observation'
      | 'accountId'
      | 'expenseCategoryId'
      | 'incomeCategoryId'
      | 'patientId'
      | 'budgetId'
      | 'installmentIndex'
      | 'installmentNumber'
      | 'totalInstallments'
      | 'recurrenceGroupId'
      | 'debitDetail'
      | 'receiveDetail'
      | 'receiptObjectKey'
      | 'cancelledById'
      | 'cancelledByName'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): FinancialEntry {
    const now = new Date();
    return new FinancialEntry(
      {
        storeId: props.storeId,
        type: props.type,
        status: props.status ?? 'pending',
        source: props.source,
        description: props.description,
        valueCents: props.valueCents,
        dueDate: props.dueDate,
        paidAt: props.paidAt ?? null,
        paidValueCents: props.paidValueCents ?? null,
        paymentMethod: props.paymentMethod ?? null,
        paymentType: props.paymentType ?? null,
        observation: props.observation ?? null,
        accountId: props.accountId ?? null,
        expenseCategoryId: props.expenseCategoryId ?? null,
        incomeCategoryId: props.incomeCategoryId ?? null,
        patientId: props.patientId ?? null,
        budgetId: props.budgetId ?? null,
        installmentIndex: props.installmentIndex ?? null,
        installmentNumber: props.installmentNumber ?? null,
        totalInstallments: props.totalInstallments ?? null,
        recurrenceGroupId: props.recurrenceGroupId ?? null,
        debitDetail: props.debitDetail ?? null,
        receiveDetail: props.receiveDetail ?? null,
        receiptObjectKey: props.receiptObjectKey ?? null,
        cancelledById: props.cancelledById ?? null,
        cancelledByName: props.cancelledByName ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  get storeId() {
    return this.props.storeId;
  }
  get type() {
    return this.props.type;
  }
  get status() {
    return this.props.status;
  }
  get source() {
    return this.props.source;
  }
  get description() {
    return this.props.description;
  }
  get valueCents() {
    return this.props.valueCents;
  }
  get dueDate() {
    return this.props.dueDate;
  }
  get paidAt() {
    return this.props.paidAt;
  }
  get paidValueCents() {
    return this.props.paidValueCents;
  }
  get paymentMethod() {
    return this.props.paymentMethod;
  }
  get paymentType() {
    return this.props.paymentType;
  }
  get observation() {
    return this.props.observation;
  }
  get accountId() {
    return this.props.accountId;
  }
  get expenseCategoryId() {
    return this.props.expenseCategoryId;
  }
  get incomeCategoryId() {
    return this.props.incomeCategoryId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get budgetId() {
    return this.props.budgetId;
  }
  get installmentIndex() {
    return this.props.installmentIndex;
  }
  get installmentNumber() {
    return this.props.installmentNumber;
  }
  get totalInstallments() {
    return this.props.totalInstallments;
  }
  get recurrenceGroupId() {
    return this.props.recurrenceGroupId;
  }
  get debitDetail() {
    return this.props.debitDetail;
  }
  get receiveDetail() {
    return this.props.receiveDetail;
  }
  get receiptObjectKey() {
    return this.props.receiptObjectKey;
  }
  get cancelledById() {
    return this.props.cancelledById;
  }
  get cancelledByName() {
    return this.props.cancelledByName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  isOverdue(today: Date): boolean {
    if (this.props.status !== 'pending') return false;
    const due = this.props.dueDate.toISOString().slice(0, 10);
    const todayIso = today.toISOString().slice(0, 10);
    return due < todayIso;
  }

  isManualPendingEditable(): boolean {
    return this.props.status === 'pending' && this.props.source === 'manual';
  }

  withReceived(input: {
    paidAt: Date;
    paidValueCents: number;
    paymentMethod: string;
    accountId: string;
    paymentType?: string | null;
    observation?: string | null;
    receiveDetail: FinancialEntryReceiveDetail;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        status: 'received',
        paidAt: input.paidAt,
        paidValueCents: input.paidValueCents,
        paymentMethod: input.paymentMethod,
        accountId: input.accountId,
        paymentType: input.paymentType ?? null,
        observation:
          input.observation !== undefined
            ? input.observation
            : this.props.observation,
        receiveDetail: input.receiveDetail,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withPaid(input: {
    paidAt: Date;
    paidValueCents: number;
    paymentMethod: string;
    accountId: string;
    paymentType?: string | null;
    observation?: string | null;
    receiveDetail: FinancialEntryReceiveDetail;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        status: 'paid',
        paidAt: input.paidAt,
        paidValueCents: input.paidValueCents,
        paymentMethod: input.paymentMethod,
        accountId: input.accountId,
        paymentType: input.paymentType ?? null,
        observation:
          input.observation !== undefined
            ? input.observation
            : this.props.observation,
        receiveDetail: input.receiveDetail,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desfaz liquidação (cancelar pagamento/recebimento): volta a `pending`.
   * “Vencido” reaparece na UI se `dueDate` &lt; hoje (`isOverdue`).
   */
  withUnsettled(): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        status: 'pending',
        paidAt: null,
        paidValueCents: null,
        paymentMethod: null,
        paymentType: null,
        accountId: null,
        receiveDetail: null,
        cancelledById: null,
        cancelledByName: null,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withCancelled(input: {
    cancelledById: string;
    cancelledByName: string;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        status: 'cancelled',
        cancelledById: input.cancelledById,
        cancelledByName: input.cancelledByName,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withManualUpdate(input: {
    description?: string;
    valueCents?: number;
    dueDate?: Date;
    expenseCategoryId?: string | null;
    incomeCategoryId?: string | null;
    observation?: string | null;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        description: input.description ?? this.props.description,
        valueCents: input.valueCents ?? this.props.valueCents,
        dueDate: input.dueDate ?? this.props.dueDate,
        expenseCategoryId:
          input.expenseCategoryId !== undefined
            ? input.expenseCategoryId
            : this.props.expenseCategoryId,
        incomeCategoryId:
          input.incomeCategoryId !== undefined
            ? input.incomeCategoryId
            : this.props.incomeCategoryId,
        observation:
          input.observation !== undefined
            ? input.observation
            : this.props.observation,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withRecurrenceFields(input: {
    description?: string;
    valueCents?: number;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        ...this.props,
        description: input.description ?? this.props.description,
        valueCents: input.valueCents ?? this.props.valueCents,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
