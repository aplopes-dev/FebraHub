import type { CatalogProductId } from './catalog-product';
import type { PaymentMethodId } from './payment';

export type OrderItemOption = {
  groupId: string;
  groupName: string;
  valueId: string;
  valueName: string;
  priceCents: number;
};

export type OrderItem = {
  id: string; // unique cart item ID
  productId: CatalogProductId;
  name: string;
  priceCents: number; // base price
  imageUrl: string | null;
  quantity: number;
  notes?: string;
  selectedOptions: readonly OrderItemOption[];
};

export type PosOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type PosOrder = {
  id: string;
  status: PosOrderStatus;
  date: string; // ISO format
  customerName: string;
  type: 'Consumo Local' | 'Delivery';
  qty: number;
  totalCents: number;
  items: readonly OrderItem[];
  paymentMethod: PaymentMethodId;
  cashierName: string;
};
