import type { PaymentMethod } from "@/features/payment-methods/types/payment-method";
import type { PaymentMethodOption } from "@/lib/option-types";

/**
 * Deriva `cardPaymentType` (discriminador do motor de recebíveis de
 * `sales-orders`) do `systemKey` real, em vez do catálogo mock local
 * (`purchases/data/mock-payment-methods.ts`, removido — spec erp/030, B2).
 * Mesma lógica que o mock já codificava, só que a partir do dado real:
 * `pm-cartao` = crédito, `pm-cartao-debito` = débito, `pm-pix` = pix, as
 * demais formas (dinheiro, boleto, formas criadas pela empresa) não têm
 * `cardPaymentType` — o motor de recebíveis não as processa.
 */
function resolveCardPaymentType(
  systemKey: string | null,
): PaymentMethodOption["cardPaymentType"] {
  switch (systemKey) {
    case "pm-cartao":
      return "credit";
    case "pm-cartao-debito":
      return "debit";
    case "pm-pix":
      return "pix";
    default:
      return undefined;
  }
}

export function toPaymentMethodOption(
  method: PaymentMethod,
): PaymentMethodOption {
  return {
    id: method.id,
    name: method.name,
    cardPaymentType: resolveCardPaymentType(method.systemKey),
  };
}

export function toPaymentMethodOptions(
  methods: readonly PaymentMethod[],
): PaymentMethodOption[] {
  return methods.map(toPaymentMethodOption);
}
