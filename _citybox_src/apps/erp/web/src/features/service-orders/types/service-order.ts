import type { ServiceOrderStatusBaseType } from "@/features/service-orders/types/service-order-status";

/** Status próprio de um equipamento dentro da OS (independente do status da OS). */
export type ServiceOrderEquipmentStatus =
  | "received"
  | "on_bench"
  | "in_repair"
  | "awaiting_part"
  | "repaired"
  | "returned";

export type ServiceOrderEquipment = {
  id: string;
  /** Ex.: "Notebook Dell Inspiron 15". */
  name: string;
  /** Marca/modelo complementar (ex.: "Dell · Inspiron 5510"). */
  brandModel: string;
  /** Nº de série / IMEI. */
  serialNumber: string;
  /** Flag: o item já foi recebido na loja. */
  received: boolean;
  /** Flag: o item já foi devolvido ao cliente. */
  returned: boolean;
  /** Estoque provisório onde o item do cliente entra enquanto está na loja. */
  warehouseId: string;
  status: ServiceOrderEquipmentStatus;
  /** Laudo — o que o cliente disse. */
  reportedIssue: string;
  /** Laudo — o que o técnico diagnosticou. */
  foundIssue: string;
  /** Laudo — o que foi feito. */
  solution: string;
  /** Laudo — observações gerais. */
  notes: string;
};

export type ServiceOrderLineKind = "service" | "product";

export type ServiceOrderLineStatus = "pending" | "in_progress" | "done";

export type ServiceOrderLine = {
  id: string;
  kind: ServiceOrderLineKind;
  /** Descrição do serviço ou nome do produto/peça. */
  description: string;
  /** Produto do catálogo quando `kind === "product"` (opcional). */
  productId: string | null;
  /** Quantidade (ex.: horas de mão de obra ou unidades da peça). */
  quantity: number;
  unitPrice: number;
  /** Desconto em reais aplicado à linha. */
  discount: number;
  status: ServiceOrderLineStatus;
  notes: string;
};

export type ServiceOrderBudgetApproval = "pending" | "approved" | "rejected";

export type ServiceOrderBudget = {
  /** Valor orçado apresentado ao cliente. */
  quotedAmount: number;
  /** ISO date da emissão do orçamento (null = ainda não orçado). */
  quotedAt: string | null;
  approval: ServiceOrderBudgetApproval;
  /** ISO date da decisão do cliente (null = pendente). */
  decidedAt: string | null;
  /** Quem aprovou/reprovou + observação livre. */
  decisionNotes: string;
  /** Taxa de diagnóstico cobrada se o orçamento for reprovado. */
  diagnosisFee: number;
};

export type ServiceOrder = {
  id: string;
  /** Código exibido (ex.: `OS-000123`). */
  code: string;
  number: number;
  customerName: string;
  customerPhone: string;
  /** ISO datetime de abertura. */
  openedAt: string;
  /** ISO datetime do prazo limite (null = sem prazo). */
  dueAt: string | null;
  sellerName: string;
  technicianName: string;
  statusId: string;
  equipments: ServiceOrderEquipment[];
  lines: ServiceOrderLine[];
  budget: ServiceOrderBudget;
  /** Id da venda gerada no encerramento (null = ainda não faturada). */
  generatedSaleId: string | null;
  createdBy: string;
};

export type ServiceOrderListTab = ServiceOrderStatusBaseType;

export type ServiceOrderListFilters = {
  statusIds: string[];
  technicianName: string | null;
  /** ISO date `yyyy-MM-dd` (inclusive). */
  openedFrom: string | null;
  /** ISO date `yyyy-MM-dd` (inclusive). */
  openedTo: string | null;
};

export type ServiceOrderSortOption =
  | "opened_at_desc"
  | "opened_at_asc"
  | "due_at_asc"
  | "amount_desc"
  | "amount_asc"
  | "number_desc"
  | "number_asc";

export type ServiceOrderTabCounts = Record<ServiceOrderListTab, number>;

export type ServiceOrderListParams = {
  tab: ServiceOrderListTab;
  search: string;
  filters: ServiceOrderListFilters;
  sort: ServiceOrderSortOption;
  page: number;
  perPage: number;
};

export type ServiceOrderListResult = {
  data: ServiceOrder[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: ServiceOrderTabCounts;
};

export const SERVICE_ORDER_EQUIPMENT_STATUS_LABELS: Record<
  ServiceOrderEquipmentStatus,
  string
> = {
  received: "Recebido",
  on_bench: "Em bancada",
  in_repair: "Em reparo",
  awaiting_part: "Aguardando peça",
  repaired: "Reparado",
  returned: "Devolvido",
};

export const SERVICE_ORDER_LINE_STATUS_LABELS: Record<
  ServiceOrderLineStatus,
  string
> = {
  pending: "Pendente",
  in_progress: "Em execução",
  done: "Concluído",
};

export const SERVICE_ORDER_BUDGET_APPROVAL_LABELS: Record<
  ServiceOrderBudgetApproval,
  string
> = {
  pending: "Aguardando aprovação",
  approved: "Aprovado",
  rejected: "Reprovado",
};

export const SERVICE_ORDER_SORT_OPTIONS: {
  value: ServiceOrderSortOption;
  label: string;
}[] = [
  { value: "opened_at_desc", label: "Abertura mais recente" },
  { value: "opened_at_asc", label: "Abertura mais antiga" },
  { value: "due_at_asc", label: "Prazo mais próximo" },
  { value: "amount_desc", label: "Maior valor" },
  { value: "amount_asc", label: "Menor valor" },
  { value: "number_desc", label: "Nº da OS (maior primeiro)" },
  { value: "number_asc", label: "Nº da OS (menor primeiro)" },
];
