import type { ContractStatus } from "@/features/sales-contracts/types/contract-status";

export const MOCK_CONTRACT_STATUSES: ContractStatus[] = [
  {
    id: "contract-status-ativo",
    name: "Ativo",
    variant: "default",
    active: true,
    sortOrder: 0,
  },
  {
    id: "contract-status-aberto",
    name: "Aberto",
    variant: "secondary",
    active: true,
    sortOrder: 1,
  },
  {
    id: "contract-status-inativo",
    name: "Inativo",
    variant: "outline",
    active: true,
    sortOrder: 2,
  },
];
