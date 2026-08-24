import type { ContractInstallment } from "@/features/sales-contracts/types/sales-contract";

/** Store mutável de parcelas geradas ao salvar contratos (mock financeiro). */
export let CONTRACT_INSTALLMENTS_STORE: ContractInstallment[] = [];

export function setContractInstallmentsStore(
  next: ContractInstallment[],
): void {
  CONTRACT_INSTALLMENTS_STORE = next;
}
