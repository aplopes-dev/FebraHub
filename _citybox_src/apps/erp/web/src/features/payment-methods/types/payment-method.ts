/** Permissão de parcelamento de uma forma de pagamento. */
export type PaymentMethodInstallmentPermission = "not_allowed" | "allowed";

export type PaymentMethod = {
  id: string;
  name: string;
  /**
   * Código `tPag` do meio de pagamento na NF-e/NFC-e (ex.: `"01"`).
   * `null` quando o usuário limpou o campo.
   */
  fiscalCode: string | null;
  installmentPermission: PaymentMethodInstallmentPermission | null;
  /**
   * Forma padrão da plataforma: aparece na lista, mas não pode ser
   * editada nem excluída pela empresa.
   */
  isSystem: boolean;
  /**
   * Slug estável das formas de sistema (`pm-dinheiro`, `pm-cartao` = crédito,
   * `pm-cartao-debito`, `pm-pix`, …) — `null` para formas criadas pela
   * empresa. Usado para derivar `cardPaymentType` em `sales-orders` sem
   * depender de um catálogo mock local (spec erp/030).
   */
  systemKey: string | null;
  deletedAt: string | null;
};

export type PaymentMethodFormValues = {
  name: string;
  fiscalCode: string | null;
  installmentPermission: PaymentMethodInstallmentPermission | null;
};

/** Lista já separada entre formas da plataforma e formas criadas pela empresa. */
export type PaymentMethodGroups = {
  system: PaymentMethod[];
  custom: PaymentMethod[];
};
