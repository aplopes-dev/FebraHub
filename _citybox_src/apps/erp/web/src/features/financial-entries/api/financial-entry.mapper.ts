import type {
  FinancialEntry,
  FinancialEntryAllocation,
  FinancialEntryAttachment,
  FinancialEntryPayment,
} from "@/features/financial-entries/types/financial-entry";
import type { FinancialEntryFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";
import type {
  FinancialEntryAllocationDto,
  FinancialEntryAttachmentDto,
  FinancialEntryDetailDto,
  FinancialEntryListItemDto,
  FinancialEntryPaymentDto,
  SaveFinancialEntryPayload,
} from "@/features/financial-entries/api/financial-entry.dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Só ids reais (uuid do banco) — um id local (`finpay-local-1`) faria o `ValidationPipe` devolver 422. */
function realId(id: string): string | undefined {
  return UUID_RE.test(id) ? id : undefined;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function centsToReais(cents: number): number {
  return cents / 100;
}

function toPayment(dto: FinancialEntryPaymentDto): FinancialEntryPayment {
  return {
    id: dto.id,
    amount: centsToReais(dto.amountCents),
    paidAt: dto.paidAt.slice(0, 10),
    paymentMethodId: dto.paymentMethod,
    cardBrandId: dto.cardBrand,
  };
}

function toAllocation(
  dto: FinancialEntryAllocationDto,
): FinancialEntryAllocation {
  return {
    id: dto.id,
    categoryId: dto.chartOfAccountId,
    costCenterId: dto.costCenterId,
    amount: centsToReais(dto.amountCents),
    percentage: dto.percentage,
  };
}

function toAttachment(
  dto: FinancialEntryAttachmentDto,
): FinancialEntryAttachment {
  return {
    id: dto.id,
    fileName: dto.fileName,
    contentType: dto.contentType,
    sizeBytes: dto.sizeBytes,
    createdAt: dto.createdAt,
  };
}

/** Detalhe completo — `GET /:id`, resposta de criar/editar. */
export function toFinancialEntry(dto: FinancialEntryDetailDto): FinancialEntry {
  return {
    id: dto.id,
    operation: dto.operation,
    baseAmount: centsToReais(dto.amountCents),
    fees: centsToReais(dto.feesCents),
    fines: centsToReais(dto.finesCents),
    bankAccountId: dto.bankAccountId ?? "",
    competenceDate: dto.competenceDate.slice(0, 10),
    dueDate: dto.dueDate.slice(0, 10),
    description: dto.description,
    partyKind: dto.customerId ? "customer" : dto.supplierId ? "supplier" : null,
    partyId: dto.customerId ?? dto.supplierId,
    partyName: dto.partyName,
    note: dto.note,
    payments: dto.payments.map(toPayment),
    allocations: dto.allocations.map(toAllocation),
    attachments: dto.attachments.map(toAttachment),
    createdBy: "Sistema",
    createdAt: dto.createdAt,
    status: dto.status,
    categoryLabel: null,
    readOnly: dto.readOnly,
    grossAmount:
      dto.grossAmountCents == null ? null : centsToReais(dto.grossAmountCents),
    acquirerFee:
      dto.acquirerFeeCents == null ? null : centsToReais(dto.acquirerFeeCents),
    installmentSequence: dto.installmentSequence,
    installmentCount: dto.installmentCount,
    cardSettlementFallback: dto.cardSettlementFallback,
  };
}

/** Item da listagem — sem `payments`/`allocations` (a API não os inclui aqui). */
export function toFinancialEntryListItem(
  dto: FinancialEntryListItemDto,
): FinancialEntry {
  return {
    id: dto.id,
    operation: dto.operation,
    baseAmount: centsToReais(dto.amountCents),
    fees: centsToReais(dto.feesCents),
    fines: centsToReais(dto.finesCents),
    bankAccountId: "",
    competenceDate: dto.competenceDate.slice(0, 10),
    dueDate: dto.dueDate.slice(0, 10),
    description: dto.description,
    partyKind: null,
    partyId: null,
    partyName: dto.partyName,
    note: "",
    payments: [],
    allocations: [],
    attachments: [],
    createdBy: "Sistema",
    createdAt: dto.createdAt,
    status: dto.status,
    categoryLabel: dto.categoryLabel,
    readOnly: false,
    grossAmount:
      dto.grossAmountCents == null ? null : centsToReais(dto.grossAmountCents),
    acquirerFee:
      dto.acquirerFeeCents == null ? null : centsToReais(dto.acquirerFeeCents),
    installmentSequence: dto.installmentSequence,
    installmentCount: dto.installmentCount,
    cardSettlementFallback: dto.cardSettlementFallback,
  };
}

/** Corpo de `POST`/`PUT` — reais → centavos; `partyKind`/`partyId` → `customerId`/`supplierId`. */
export function toSaveFinancialEntryPayload(
  values: FinancialEntryFormValues,
): SaveFinancialEntryPayload {
  return {
    operation: values.operation,
    description: values.description.trim() || undefined,
    amountCents: reaisToCents(values.baseAmount),
    feesCents: reaisToCents(values.fees),
    finesCents: reaisToCents(values.fines),
    competenceDate: values.competenceDate,
    dueDate: values.dueDate,
    partyName: values.partyName.trim() || undefined,
    customerId: values.partyKind === "customer" ? values.partyId : null,
    supplierId: values.partyKind === "supplier" ? values.partyId : null,
    bankAccountId: values.bankAccountId || null,
    note: values.note.trim() || undefined,
    payments: values.payments
      .filter((payment) => payment.amount > 0 && payment.paidAt && payment.paymentMethodId)
      .map((payment) => ({
        id: realId(payment.id),
        amountCents: reaisToCents(payment.amount),
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethodId,
        cardBrand: payment.cardBrandId || null,
      })),
    allocations: values.allocations
      .filter((allocation) => allocation.categoryId && allocation.costCenterId)
      .map((allocation) => ({
        id: realId(allocation.id),
        chartOfAccountId: allocation.categoryId,
        costCenterId: allocation.costCenterId,
        amountCents: reaisToCents(allocation.amount),
        percentage: allocation.percentage,
      })),
  };
}
