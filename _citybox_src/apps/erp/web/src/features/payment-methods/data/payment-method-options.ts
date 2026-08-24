import type { PaymentMethodInstallmentPermission } from "@/features/payment-methods/types/payment-method";

export type PaymentMethodSelectOption = {
  value: string;
  label: string;
};

/**
 * Tabela `tPag` (meio de pagamento) da NF-e / NFC-e.
 * Fonte: Nota Técnica 2023.004 — mesma lista oferecida pelos ERPs do setor.
 */
export const PAYMENT_METHOD_FISCAL_CODE_OPTIONS: PaymentMethodSelectOption[] = [
  { value: "01", label: "01 - Dinheiro" },
  { value: "02", label: "02 - Cheque" },
  { value: "03", label: "03 - Cartão de Crédito" },
  { value: "04", label: "04 - Cartão de Débito" },
  { value: "05", label: "05 - Crédito Loja" },
  { value: "10", label: "10 - Vale Alimentação" },
  { value: "11", label: "11 - Vale Refeição" },
  { value: "12", label: "12 - Vale Presente" },
  { value: "13", label: "13 - Vale Combustível" },
  { value: "14", label: "14 - Duplicata Mercantil" },
  { value: "15", label: "15 - Boleto Bancário" },
  { value: "16", label: "16 - Depósito Bancário" },
  { value: "17", label: "17 - Pagamento Instantâneo (PIX) - Dinâmico" },
  { value: "18", label: "18 - Transferência bancária, Carteira Digital" },
  {
    value: "19",
    label: "19 - Programa de fidelidade, Cashback, Crédito Virtual",
  },
  { value: "20", label: "20 - Pagamento Instantâneo (PIX) - Estático" },
  { value: "21", label: "21 - Crédito em Loja" },
  {
    value: "22",
    label: "22 - Pagamento Eletrônico não informado - falha de hardware",
  },
  { value: "90", label: "90 - Sem pagamento" },
  { value: "99", label: "99 - Outros" },
];

export const PAYMENT_METHOD_INSTALLMENT_OPTIONS: readonly {
  value: PaymentMethodInstallmentPermission;
  label: string;
}[] = [
  { value: "not_allowed", label: "Não permitir" },
  { value: "allowed", label: "Permitir" },
];

/** Valores pré-selecionados ao abrir "Nova forma de pagamento". */
export const DEFAULT_PAYMENT_METHOD_FISCAL_CODE = "01";
export const DEFAULT_PAYMENT_METHOD_INSTALLMENT_PERMISSION =
  "not_allowed" satisfies PaymentMethodInstallmentPermission;

/** Tamanho máximo do nome (contador exibido dentro do campo). */
export const PAYMENT_METHOD_NAME_MAX = 40;

export function findFiscalCodeOption(
  value: string | null,
): PaymentMethodSelectOption | null {
  if (!value) return null;
  return (
    PAYMENT_METHOD_FISCAL_CODE_OPTIONS.find(
      (option) => option.value === value,
    ) ?? null
  );
}

export function findInstallmentOption(
  value: PaymentMethodInstallmentPermission | null,
) {
  if (!value) return null;
  return (
    PAYMENT_METHOD_INSTALLMENT_OPTIONS.find(
      (option) => option.value === value,
    ) ?? null
  );
}
