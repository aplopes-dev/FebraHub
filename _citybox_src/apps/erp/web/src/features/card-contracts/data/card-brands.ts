/**
 * Catálogo fixo de bandeiras de cartão — usado no `Select` de bandeira do
 * cadastro de método de pagamento do contrato de cartão, reaproveitado pelo
 * painel de pagamentos do pedido de venda (motor de recebíveis,
 * `specs/erp/005-card-receivables-engine/research.md` D3) e, desde
 * `specs/erp/007-financeiro-ajustes-ui` (US9), pela seção Pagamentos do
 * formulário de lançamento financeiro — mesmo arquivo, mesmos `value`s nos
 * três lugares.
 *
 * 2026-08-09 (US9/R10): ampliado com Sorocred, Credicard, Ticket, VR
 * Benefícios e Banricompras — os 10 `value`s anteriores foram preservados
 * sem alteração (nem grafia) porque já estão persistidos em
 * `CardPaymentMethod.brand`/`SaleOrderPayment.cardBrand`/
 * `FinancialEntryPayment.cardBrand` e o motor de recebíveis compara por
 * igualdade exata.
 */
export type CardBrandOption = {
  value: string;
  label: string;
};

export const CARD_BRAND_OPTIONS: CardBrandOption[] = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "Elo", label: "Elo" },
  { value: "American Express", label: "American Express" },
  { value: "Hipercard", label: "Hipercard" },
  { value: "Diners Club", label: "Diners Club" },
  { value: "Discover", label: "Discover" },
  { value: "Sodexo", label: "Sodexo" },
  { value: "Alelo", label: "Alelo" },
  { value: "Outra", label: "Outra" },
  { value: "Sorocred", label: "Sorocred" },
  { value: "Credicard", label: "Credicard" },
  { value: "Ticket", label: "Ticket" },
  { value: "VR Benefícios", label: "VR Benefícios" },
  { value: "Banricompras", label: "Banricompras" },
];
