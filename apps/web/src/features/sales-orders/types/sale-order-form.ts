import type { SaleOrderStatus } from "@/features/sales-orders/types/sale-order";
import type { PaymentMethodType } from "@/features/card-contracts/types/card-contract";

export const SALE_ORDER_NOTES_MAX_LENGTH = 2000;

export type SaleOrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type SaleOrderPayment = {
  id: string;
  amount: number;
  paymentMethodId: string;
  bankAccountId: string;
  /**
   * Discriminador estrutural para o motor de recebíveis do contrato de
   * cartões — setado pela forma de pagamento escolhida (`pm-cartao-debito`,
   * `pm-cartao-credito`, `pm-pix`). `undefined` para dinheiro/boleto/
   * transferência, que o motor não processa.
   */
  cardPaymentType?: PaymentMethodType;
  /** Bandeira do cartão, do catálogo fixo `card-contracts/data/card-brands`. */
  brand?: string;
  /** Nº de parcelas do crédito. */
  installments?: number;
};

export type SaleOrderFormValues = {
  warehouseId: string;
  customerId: string;
  soldAt: string;
  status: SaleOrderStatus;
  sellerId: string;
  notes: string;
  lines: SaleOrderLine[];
  payments: SaleOrderPayment[];
  deliveryFee: number;
  discounts: number;
};

export type SaleOrderSellerOption = {
  id: string;
  name: string;
};

export type SaleOrderCustomerOption = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type SaveSaleOrderInput = {
  customerName: string;
  totalAmount: number;
  status: SaleOrderStatus;
  createdBy: string;
  soldAt: string;
  /** Campos completos do formulário — opcionais para não quebrar chamadas
   * legadas (ex.: `generateSaleFromServiceOrder`) que só têm o resumo. */
  warehouseId?: string;
  customerId?: string;
  sellerId?: string;
  notes?: string;
  lines?: SaleOrderLine[];
  payments?: SaleOrderPayment[];
  deliveryFee?: number;
  discounts?: number;
};
