import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type PatientFinancialEntryStatus = 'pending' | 'received';
export type PatientFinancialEntrySource = 'budget_approve' | 'avulso_debit';

export type PatientFinancialDebitTreatment = {
  id: string;
  planId: string;
  treatmentId: string;
  treatmentName: string;
  value: string;
  professionalId: string;
  toothNumber: number | null;
};

export type PatientFinancialDebitAttachment = {
  id: string;
  name: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
};

export type PatientFinancialDebitDetail = {
  observations: string;
  treatments: PatientFinancialDebitTreatment[];
  attachments?: PatientFinancialDebitAttachment[];
};

export type PatientFinancialReceiveDetail = {
  paymentMethod: string;
  paidValueCents: number;
  cashRegisterId: string;
  observations: string;
  cardMode?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};

export type PatientFinancialEntryProps = {
  storeId: string;
  patientId: string;
  date: Date;
  name: string;
  valueCents: number;
  status: PatientFinancialEntryStatus;
  source: PatientFinancialEntrySource;
  budgetId: string | null;
  budgetItemId: string | null;
  installmentIndex: number | null;
  receivedAt: Date | null;
  debitDetail: PatientFinancialDebitDetail | null;
  receiveDetail: PatientFinancialReceiveDetail | null;
  receiptObjectKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PatientFinancialEntry extends Entity<PatientFinancialEntryProps> {
  constructor(props: PatientFinancialEntryProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      PatientFinancialEntryProps,
      | 'status'
      | 'budgetId'
      | 'budgetItemId'
      | 'installmentIndex'
      | 'receivedAt'
      | 'debitDetail'
      | 'receiveDetail'
      | 'receiptObjectKey'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): PatientFinancialEntry {
    const now = new Date();
    return new PatientFinancialEntry(
      {
        status: props.status ?? 'pending',
        budgetId: props.budgetId ?? null,
        budgetItemId: props.budgetItemId ?? null,
        installmentIndex: props.installmentIndex ?? null,
        receivedAt: props.receivedAt ?? null,
        debitDetail: props.debitDetail ?? null,
        receiveDetail: props.receiveDetail ?? null,
        receiptObjectKey: props.receiptObjectKey ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        storeId: props.storeId,
        patientId: props.patientId,
        date: props.date,
        name: props.name,
        valueCents: props.valueCents,
        source: props.source,
      },
      id,
    );
  }

  get storeId() {
    return this.props.storeId;
  }

  get patientId() {
    return this.props.patientId;
  }

  get date() {
    return this.props.date;
  }

  get name() {
    return this.props.name;
  }

  get valueCents() {
    return this.props.valueCents;
  }

  get status() {
    return this.props.status;
  }

  get source() {
    return this.props.source;
  }

  get budgetId() {
    return this.props.budgetId;
  }

  get budgetItemId() {
    return this.props.budgetItemId;
  }

  get installmentIndex() {
    return this.props.installmentIndex;
  }

  get receivedAt() {
    return this.props.receivedAt;
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

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  /** @deprecated Prefer isEditablePendingDebit — kept for callers still migrating. */
  isEditableAvulsoDebit(): boolean {
    return this.isEditablePendingDebit() && this.props.source === 'avulso_debit';
  }

  isEditablePendingDebit(): boolean {
    return (
      this.props.status === 'pending' &&
      (this.props.source === 'avulso_debit' ||
        this.props.source === 'budget_approve')
    );
  }

  withReceived(
    receivedAt: Date,
    receiveDetail: PatientFinancialReceiveDetail,
  ): PatientFinancialEntry {
    return PatientFinancialEntry.create(
      {
        ...this.props,
        status: 'received',
        receivedAt,
        receiveDetail,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withAvulsoDebitUpdate(input: {
    date: Date;
    name: string;
    valueCents: number;
    debitDetail: PatientFinancialDebitDetail;
  }): PatientFinancialEntry {
    return PatientFinancialEntry.create(
      {
        ...this.props,
        date: input.date,
        name: input.name,
        valueCents: input.valueCents,
        debitDetail: input.debitDetail,
        receiptObjectKey: firstAttachmentObjectKey(input.debitDetail),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withPendingDebitUpdate(input: {
    valueCents: number;
    debitDetail: PatientFinancialDebitDetail;
  }): PatientFinancialEntry {
    return PatientFinancialEntry.create(
      {
        ...this.props,
        valueCents: input.valueCents,
        debitDetail: input.debitDetail,
        receiptObjectKey: firstAttachmentObjectKey(input.debitDetail),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withDebitDetail(debitDetail: PatientFinancialDebitDetail): PatientFinancialEntry {
    return PatientFinancialEntry.create(
      {
        ...this.props,
        debitDetail,
        receiptObjectKey:
          this.props.receiptObjectKey ?? firstAttachmentObjectKey(debitDetail),
      },
      this.id,
    );
  }
}

function firstAttachmentObjectKey(
  debitDetail: PatientFinancialDebitDetail,
): string | null {
  return debitDetail.attachments?.[0]?.objectKey ?? null;
}
