import type {
  ServiceOrder,
  ServiceOrderBudget,
  ServiceOrderEquipment,
  ServiceOrderLine,
  ServiceOrderLineKind,
} from "@/features/service-orders/types/service-order";

let idCounter = 0;

/** Id local estável para linhas/equipamentos criados no form (mock UI). */
export function createLocalId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-local-${idCounter}`;
}

/** Formata o código exibido da OS a partir do número sequencial. */
export function formatServiceOrderCode(number: number): string {
  return `OS-${String(number).padStart(6, "0")}`;
}

/**
 * Valores do formulário de OS. Reusa os sub-tipos da entidade (equipamentos,
 * linhas, orçamento) para a conversão form ↔ entidade ser trivial.
 */
export type ServiceOrderFormValues = {
  customerName: string;
  customerPhone: string;
  /** ISO date `yyyy-MM-dd`. */
  openedDate: string;
  /** `HH:mm`. */
  openedTime: string;
  /** ISO date `yyyy-MM-dd` ("" = sem prazo). */
  dueDate: string;
  /** `HH:mm`. */
  dueTime: string;
  sellerName: string;
  technicianName: string;
  statusId: string;
  equipments: ServiceOrderEquipment[];
  lines: ServiceOrderLine[];
  budget: ServiceOrderBudget;
};

export function createEmptyEquipment(): ServiceOrderEquipment {
  return {
    id: createLocalId("eq"),
    name: "",
    brandModel: "",
    serialNumber: "",
    received: true,
    returned: false,
    warehouseId: "",
    status: "received",
    reportedIssue: "",
    foundIssue: "",
    solution: "",
    notes: "",
  };
}

export function createEmptyLine(kind: ServiceOrderLineKind): ServiceOrderLine {
  return {
    id: createLocalId("ln"),
    kind,
    description: "",
    productId: null,
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    status: "pending",
    notes: "",
  };
}

export function createEmptyBudget(): ServiceOrderBudget {
  return {
    quotedAmount: 0,
    quotedAt: null,
    approval: "pending",
    decidedAt: null,
    decisionNotes: "",
    diagnosisFee: 0,
  };
}

function nowParts(): { date: string; time: string } {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

export function createEmptyServiceOrderFormValues(
  defaultStatusId: string,
): ServiceOrderFormValues {
  const { date, time } = nowParts();
  return {
    customerName: "",
    customerPhone: "",
    openedDate: date,
    openedTime: time,
    dueDate: "",
    dueTime: "18:00",
    sellerName: "",
    technicianName: "",
    statusId: defaultStatusId,
    equipments: [createEmptyEquipment()],
    lines: [],
    budget: createEmptyBudget(),
  };
}

function isoToParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "18:00" };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "18:00" };
  const date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  const time = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

/** Combina date+time locais em ISO datetime ("" de data → null). */
export function partsToIso(date: string, time: string): string | null {
  if (!date) return null;
  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

export function serviceOrderToFormValues(
  order: ServiceOrder,
): ServiceOrderFormValues {
  const opened = isoToParts(order.openedAt);
  const due = isoToParts(order.dueAt);
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    openedDate: opened.date,
    openedTime: opened.time,
    dueDate: due.date,
    dueTime: due.time,
    sellerName: order.sellerName,
    technicianName: order.technicianName,
    statusId: order.statusId,
    equipments: order.equipments.map((equipment) => ({ ...equipment })),
    lines: order.lines.map((line) => ({ ...line })),
    budget: { ...order.budget },
  };
}
