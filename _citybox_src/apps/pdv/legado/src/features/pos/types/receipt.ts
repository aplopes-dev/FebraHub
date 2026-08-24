import type { OrderItem } from './order';
import type { PaymentMethodId } from './payment';

export type ReceiptData = {
  orderId: string;
  paidAtIso: string;
  storeName: string;
  storeAddress: string;
  storeLogoUrl: string | null;
  salespersonName: string;
  customerName: string | null;
  items: readonly OrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  receivedCents: number;
  changeCents: number;
  paymentMethod: PaymentMethodId;
};
