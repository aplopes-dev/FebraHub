import type { PaymentMethodOption } from "@/lib/option-types";

/**
 * `cardPaymentType` marca as formas que o motor de recebíveis do contrato de
 * cartões processa (`sales-orders`) — as demais telas que reaproveitam este
 * catálogo (compras, OS, contratos de venda) ignoram o campo.
 */
export const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "pm-pix", name: "PIX", cardPaymentType: "pix" },
  { id: "pm-boleto", name: "Boleto" },
  { id: "pm-transferencia", name: "Transferência" },
  { id: "pm-cartao-debito", name: "Cartão de débito", cardPaymentType: "debit" },
  { id: "pm-cartao-credito", name: "Cartão de crédito", cardPaymentType: "credit" },
  { id: "pm-dinheiro", name: "Dinheiro" },
];

/**
 * Cópia defensiva do catálogo mock.
 *
 * Morava em `features/purchases/services/purchase.service.ts` — Compras foi a
 * primeira tela a precisar, e as de Vendas passaram a importar de lá. Quando o
 * painel de Pagamentos saiu do formulário de compra, Compras deixou de usar e
 * sobrou um arquivo de Compras existindo só para Vendas. Agora mora onde é
 * consumido: pedidos de venda, contratos e ordens de serviço.
 */
export function listPaymentMethods(): PaymentMethodOption[] {
  return MOCK_PAYMENT_METHODS.map((item) => ({ ...item }));
}
