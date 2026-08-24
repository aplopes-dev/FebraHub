import type {
  ServiceOrderHttpDto,
  ServiceOrderWritablePayload,
} from "./service-order.dto";
import type {
  ServiceOrder,
  ServiceOrderBudget,
  ServiceOrderEquipment,
  ServiceOrderLine,
} from "../types/service-order";
import type { ServiceOrderFormValues } from "../lib/service-order-form-values";
import { partsToIso } from "../lib/service-order-form-values";
import { computeServiceOrderTotal } from "../lib/service-order-totals";

type PayloadShape = {
  number?: number;
  createdBy?: string;
  equipments?: ServiceOrderEquipment[];
  lines?: ServiceOrderLine[];
  uiLines?: ServiceOrderLine[];
  budget?: ServiceOrderBudget;
};

function asPayload(raw: unknown): PayloadShape {
  if (!raw || typeof raw !== "object") return {};
  return raw as PayloadShape;
}

function codeToNumber(code: string): number {
  const digits = code.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/**
 * Monta `payloadJson.lines` para o `generate-sale` (spec erp/031 D1) — inclui
 * tanto linhas de produto de catálogo quanto linhas de serviço (sem
 * `productId`), que antes eram descartadas silenciosamente aqui.
 */
function linesForGenerateSale(lines: ServiceOrderLine[]) {
  return lines
    .filter((line) => (line.kind === "product" && line.productId) || line.kind === "service")
    .map((line) =>
      line.kind === "product" && line.productId
        ? {
            productId: line.productId,
            quantity: String(line.quantity),
            unitPriceCents: Math.round(line.unitPrice * 100),
          }
        : {
            productId: null,
            description: line.description,
            quantity: String(line.quantity),
            unitPriceCents: Math.round(line.unitPrice * 100),
          },
    );
}

export function toServiceOrder(dto: ServiceOrderHttpDto): ServiceOrder {
  const payload = asPayload(dto.payloadJson);
  const lines = Array.isArray(payload.uiLines)
    ? payload.uiLines
    : Array.isArray(payload.lines) &&
        payload.lines.length > 0 &&
        "kind" in (payload.lines[0] as object)
      ? (payload.lines as ServiceOrderLine[])
      : [];
  const equipments = Array.isArray(payload.equipments) ? payload.equipments : [];
  const budget: ServiceOrderBudget = payload.budget ?? {
    quotedAmount: dto.budgetedCents / 100,
    quotedAt: null,
    approval:
      (dto.approvalStatus as ServiceOrderBudget["approval"]) || "pending",
    decidedAt: null,
    decisionNotes: dto.approvalNotes || "",
    diagnosisFee: dto.diagnosisFeeCents / 100,
  };

  return {
    id: dto.id,
    code: dto.code,
    number: payload.number ?? codeToNumber(dto.code),
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    openedAt: dto.openedAt,
    dueAt: dto.dueAt,
    sellerName: dto.sellerName,
    technicianName: dto.technicianName,
    statusId: dto.statusId,
    equipments,
    lines,
    budget,
    generatedSaleId: dto.generatedSaleId,
    createdBy: payload.createdBy ?? "Operador",
  };
}

export function formValuesToWritable(
  values: ServiceOrderFormValues,
  extras?: { createdBy?: string; number?: number },
): ServiceOrderWritablePayload {
  const openedAt =
    partsToIso(values.openedDate, values.openedTime) ??
    new Date().toISOString();
  const dueAt = partsToIso(values.dueDate, values.dueTime) ?? undefined;
  const lines = values.lines.map((line) => ({ ...line }));
  const totalCents = Math.round(computeServiceOrderTotal(lines) * 100);
  const generateLines = linesForGenerateSale(lines);

  return {
    customerName: values.customerName.trim(),
    customerPhone: values.customerPhone.trim() || undefined,
    statusId: values.statusId,
    sellerName: values.sellerName || undefined,
    technicianName: values.technicianName || undefined,
    openedAt,
    dueAt,
    totalCents,
    budgetedCents: Math.round(values.budget.quotedAmount * 100),
    diagnosisFeeCents: Math.round(values.budget.diagnosisFee * 100),
    approvalStatus: values.budget.approval,
    approvalNotes: values.budget.decisionNotes || undefined,
    payloadJson: {
      number: extras?.number,
      createdBy: extras?.createdBy ?? "Operador",
      equipments: values.equipments.map((e) => ({ ...e })),
      uiLines: lines,
      // API generate-sale lê payloadJson.lines
      lines: generateLines,
      budget: { ...values.budget },
    },
  };
}
