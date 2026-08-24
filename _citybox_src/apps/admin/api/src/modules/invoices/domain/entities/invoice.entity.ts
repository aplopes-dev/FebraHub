import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { InvoiceValidatorFactory } from '../factories/invoice-validator.factory';
import { InvalidInvoiceStateTransitionError } from '../errors/invalid-invoice-state-transition.error';

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'PAST_DUE' | 'VOID';

export type InvoiceProps = {
  subscriptionId: string;
  /** Unidade de billing (FR-002). Obrigatória desde a Fase 10 — não há mais Cliente. */
  storeId: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt: Date | null;
  method: string | null;
  gatewayPaymentId: string | null;
  invoiceUrl?: string | null;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string | null;
  /**
   * Nome e documento **da loja**, desnormalizados para exibição. Os nomes seguem
   * `client*` porque no produto a Loja É o cliente do Citybox desde o PLAT-001 (é assim
   * que o módulo aparece no admin). A origem do dado mudou na Fase 10: vinha de
   * `clients`, agora vem de `stores`.
   */
  clientName?: string;
  clientDocument?: string;
};

export class Invoice extends Entity<InvoiceProps> {
  constructor(props: InvoiceProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    InvoiceValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      InvoiceProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'currency'
      | 'paidAt'
      | 'method'
      | 'gatewayPaymentId'
      | 'invoiceUrl'
      | 'notes'
    >,
    id?: string,
  ): Invoice {
    return new Invoice(
      {
        ...props,
        currency: props.currency ?? 'BRL',
        status: props.status ?? 'DRAFT',
        paidAt: props.paidAt ?? null,
        method: props.method ?? null,
        gatewayPaymentId: props.gatewayPaymentId ?? null,
        invoiceUrl: props.invoiceUrl ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: InvoiceProps, id: string): Invoice {
    return new Invoice(props, id);
  }

  get subscriptionId() {
    return this.props.subscriptionId;
  }

  get storeId() {
    return this.props.storeId;
  }

  get clientName() {
    return this.props.clientName;
  }

  get clientDocument() {
    return this.props.clientDocument;
  }

  get amountCents() {
    return this.props.amountCents;
  }

  get currency() {
    return this.props.currency;
  }

  get status() {
    return this.props.status;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get method() {
    return this.props.method;
  }

  get gatewayPaymentId() {
    return this.props.gatewayPaymentId;
  }

  public setGatewayPaymentId(gatewayPaymentId: string): void {
    this.props.gatewayPaymentId = gatewayPaymentId;
  }

  get invoiceUrl() {
    return this.props.invoiceUrl ?? null;
  }

  public setInvoiceUrl(invoiceUrl: string | null): void {
    this.props.invoiceUrl = invoiceUrl;
  }

  get notes() {
    return this.props.notes;
  }

  get periodStart() {
    return this.props.periodStart;
  }

  get periodEnd() {
    return this.props.periodEnd;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public publish(): void {
    if (this.props.status !== 'DRAFT') {
      throw new InvalidInvoiceStateTransitionError(
        Invoice.name,
        this.props.status,
        'OPEN',
      );
    }
    this.props.status = 'OPEN';
    this.touch();
  }

  public markPaid(method: string): void {
    if (this.props.status !== 'OPEN' && this.props.status !== 'PAST_DUE') {
      throw new InvalidInvoiceStateTransitionError(
        Invoice.name,
        this.props.status,
        'PAID',
      );
    }
    this.props.status = 'PAID';
    this.props.paidAt = new Date();
    this.props.method = method;
    this.touch();
  }

  public markPastDue(): void {
    if (this.props.status !== 'OPEN') {
      throw new InvalidInvoiceStateTransitionError(
        Invoice.name,
        this.props.status,
        'PAST_DUE',
      );
    }
    this.props.status = 'PAST_DUE';
    this.touch();
  }

  public void(): void {
    if (
      this.props.status !== 'DRAFT' &&
      this.props.status !== 'OPEN' &&
      this.props.status !== 'PAST_DUE'
    ) {
      throw new InvalidInvoiceStateTransitionError(
        Invoice.name,
        this.props.status,
        'VOID',
      );
    }
    this.props.status = 'VOID';
    this.touch();
  }

  public checkPastDue(): boolean {
    if (this.props.status === 'OPEN' && this.props.dueDate < new Date()) {
      this.markPastDue();
      return true;
    }
    return false;
  }
}
