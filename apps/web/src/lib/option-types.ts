/**
 * Formatos de opção compartilhados entre features.
 *
 * Estes tipos moravam em `features/purchases/types/purchase.ts` por acidente
 * histórico — Compras foi a primeira tela a precisar deles. Hoje são
 * consumidos por Finanças (lançamentos, extrato, contratos de cartão),
 * Vendas, Ordens de serviço e Conciliação bancária, ou seja, quase todo mundo
 * **menos** Compras, que deixou de usá-los quando o painel de Pagamentos saiu.
 *
 * Manter em `lib/` evita que uma feature seja dona do vocabulário das outras:
 * apagar ou renomear algo em Compras não deve quebrar o Extrato.
 */

export type PaymentMethodOption = {
  id: string;
  name: string;
  /**
   * Discriminador estrutural para o motor de recebíveis do contrato de
   * cartões (`sales-orders`) — ausente para formas de pagamento que o motor
   * não processa (dinheiro, boleto, transferência). Ignorado pelas demais
   * telas que reaproveitam este catálogo.
   */
  cardPaymentType?: "pix" | "debit" | "credit";
};

export type BankAccountOption = {
  id: string;
  name: string;
};

export type CostCenterOption = {
  id: string;
  name: string;
};

export type FinanceCategoryOption = {
  id: string;
  name: string;
};

export type WarehouseOption = {
  id: string;
  name: string;
};
