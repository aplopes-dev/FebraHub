/**
 * Catálogo de bancos — constante de referência (como uma lista de UFs), não
 * um mock de dados de conta. `code` é o identificador estável persistido em
 * `BankAccount.bankCode`, usado para o `Select` do formulário reabrir sempre
 * com o banco originalmente selecionado (FR-015/SC-005). Sem tela de
 * cadastro própria — ver `specs/erp/002-bank-account-ledger/research.md` D5.
 *
 * **2026-08-07 (spec `007-financeiro-ajustes-ui`, US7):** lista de 19 bancos +
 * Conta PDV com o código especificado (não mais os slugs semânticos
 * `bank-bb`/`bank-nubank`/etc. da versão anterior). Contas já cadastradas com
 * um `bankCode` fora desta lista continuam existindo — `getBankNameByCode`
 * cai no fallback `"—"` (Assumption do spec: valor histórico não é migrado).
 */
export type BankCatalogEntry = {
  code: string;
  name: string;
};

export const BANK_CATALOG: BankCatalogEntry[] = [
  { code: "70", name: "Banco de Brasília" },
  { code: "1", name: "Banco do Brasil" },
  { code: "4", name: "Banco do Nordeste" },
  { code: "756", name: "Bancoob" },
  { code: "21", name: "Banestes" },
  { code: "479", name: "BankBoston" },
  { code: "37", name: "Banpará" },
  { code: "41", name: "Banrisul" },
  { code: "291", name: "BCN" },
  { code: "237", name: "Bradesco" },
  { code: "208", name: "BTG Pactual" },
  { code: "336", name: "C6 Bank" },
  { code: "104", name: "Caixa Econômica" },
  { code: "745", name: "Citibank" },
  { code: "-30", name: "Conta PDV" },
  { code: "89", name: "Credisan" },
  { code: "399", name: "HSBC" },
  { code: "77", name: "Inter" },
  { code: "341", name: "Itaú" },
  { code: "389", name: "Mercantil do Brasil" },
];

export function getBankNameByCode(code: string): string {
  return BANK_CATALOG.find((bank) => bank.code === code)?.name ?? "—";
}
