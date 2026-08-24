/** Snapshots de pagamento simulado — shapes ApiPaymentResult/ApiOrderPaymentMethod do contrato. */

const PIX_EXPIRES_MIN = 30;
const BOLETO_DUE_DAYS = 3;

export interface ApiPaymentResult {
  type: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  paymentMethodId?: string | null;
  displayName?: string | null;
  authorizationCode?: string | null;
  pixQrCodeBase64?: string | null;
  pixCopyPaste?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: string | null;
  pdfUrl?: string | null;
  expiresAt?: string | null;
}

export interface ApiOrderPaymentMethod {
  type: string;
  displayName: string;
  label?: string;
}

/** Persistido em Order.payment: resultado + método exibível no pedido. */
export interface StoredPayment {
  result: ApiPaymentResult;
  method: ApiOrderPaymentMethod;
}

interface PaymentMethodRow {
  brand: string;
  lastFour: string;
  label: string;
}

interface BuildPaymentInput {
  type: string;
  orderId: string;
  total: number;
  paymentMethod: PaymentMethodRow | null;
  paymentMethodId: string | null;
  qrPlaceholderBase64: string;
}

/** Replica os resultados do mock (checkout-logic.ts#createOrderFromRequest). */
export function buildPaymentResult(input: BuildPaymentInput): StoredPayment {
  if (input.type === 'PIX') {
    return {
      result: {
        type: 'PIX',
        status: 'PENDING',
        pixQrCodeBase64: input.qrPlaceholderBase64,
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136${input.orderId}520400005303986540${input.total.toFixed(2)}5802BR5925CityBox6009SAO PAULO62070503***6304ABCD`,
        expiresAt: new Date(Date.now() + PIX_EXPIRES_MIN * 60_000).toISOString(),
      },
      method: { type: 'PIX', displayName: 'PIX', label: 'PIX · 5% off' },
    };
  }
  if (input.type === 'BOLETO') {
    return {
      result: {
        type: 'BOLETO',
        status: 'PENDING',
        barcode: '23793.38128 60000.000003 00000.000400 1 84340000062991',
        digitableLine: '2379338128600000000300000000400184340000062991',
        dueDate: new Date(Date.now() + BOLETO_DUE_DAYS * 86_400_000).toISOString(),
        pdfUrl: `https://cdn.citybox.com.br/boletos/${input.orderId}.pdf`,
      },
      method: {
        type: 'BOLETO',
        displayName: 'Boleto',
        label: 'Boleto · vence em 3 dias úteis',
      },
    };
  }
  const pm = input.paymentMethod;
  const method: ApiOrderPaymentMethod = pm
    ? { type: 'CARD', displayName: `${pm.brand} ****${pm.lastFour}`, label: pm.label }
    : { type: 'CARD', displayName: 'Cartão', label: 'Cartão' };
  return {
    result: {
      type: 'CARD',
      status: 'APPROVED',
      paymentMethodId: input.paymentMethodId ?? null,
      displayName: method.displayName,
      authorizationCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`,
    },
    method,
  };
}
