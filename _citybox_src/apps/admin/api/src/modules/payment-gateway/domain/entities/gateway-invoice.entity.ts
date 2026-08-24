import { Entity } from '../../../../shared/core/entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export type GatewayInvoiceProps = {
  gatewayPaymentId: string;
  gatewayCustomerId: string;
  gatewaySubscriptionId?: string | null;
  value: number;
  status: InvoiceStatus;
  billingType: PaymentMethod;
  dueDate: Date;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  bankSlipBarCode?: string | null;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  description?: string | null;
};

export class GatewayInvoice extends Entity<GatewayInvoiceProps> {
  protected validate(): void {}

  static create(props: GatewayInvoiceProps, id?: string): GatewayInvoice {
    return new GatewayInvoice(props, id);
  }

  get gatewayPaymentId() {
    return this.props.gatewayPaymentId;
  }

  get gatewayCustomerId() {
    return this.props.gatewayCustomerId;
  }

  get gatewaySubscriptionId() {
    return this.props.gatewaySubscriptionId;
  }

  get value() {
    return this.props.value;
  }

  get status() {
    return this.props.status;
  }

  get billingType() {
    return this.props.billingType;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get invoiceUrl() {
    return this.props.invoiceUrl;
  }

  get bankSlipUrl() {
    return this.props.bankSlipUrl;
  }

  get bankSlipBarCode() {
    return this.props.bankSlipBarCode;
  }

  get pixQrCode() {
    return this.props.pixQrCode;
  }

  get pixCopyPaste() {
    return this.props.pixCopyPaste;
  }

  get description() {
    return this.props.description;
  }
}
