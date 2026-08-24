import type { BudgetDetail } from '../../../../application/dtos/budget.dto';
import type { BudgetListItem } from '../../../../domain/repositories/budget.repository.interface';
import type { BudgetUpsertPayload } from '../../../../application/dtos/budget.dto';
import type { UpsertBudgetBodyDto } from './budget-body.dto';

export function toBudgetUpsertPayload(
  body: UpsertBudgetBodyDto,
): BudgetUpsertPayload {
  return {
    description: body.description,
    date: new Date(body.date),
    observations: body.observations ?? '',
    responsibleId: body.responsibleId,
    responsibleName: body.responsibleName ?? '',
    discount: body.discount ?? null,
    installmentEnabled: body.installmentEnabled,
    downPaymentCents: body.downPaymentCents,
    installmentsCount: body.installmentsCount,
    items: body.items.map((item) => ({
      planId: item.planId,
      treatmentId: item.treatmentId,
      professionalId: item.professionalId,
      professionalName: item.professionalName ?? '',
      valueCents: item.valueCents,
      locationType: item.locationType,
      locationLabel: item.locationLabel ?? '',
      sessionIndex: item.sessionIndex ?? null,
      sessionTotal: item.sessionTotal ?? null,
      sortOrder: item.sortOrder,
    })),
  };
}

function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toBudgetResponse(detail: BudgetDetail) {
  const { budget, items } = detail;
  return {
    id: budget.id,
    patientId: budget.patientId,
    description: budget.description,
    date: toIsoDateOnly(budget.date),
    observations: budget.observations,
    responsibleId: budget.responsibleId,
    responsibleName: budget.responsibleName,
    discount:
      budget.discountType && budget.discountValue !== null
        ? { type: budget.discountType, value: budget.discountValue }
        : null,
    subtotalCents: budget.subtotalCents,
    finalValueCents: budget.finalValueCents,
    installment: {
      enabled: budget.installmentEnabled,
      downPaymentCents: budget.downPaymentCents,
      installmentsCount: budget.installmentsCount,
    },
    status: budget.status,
    supersedesBudgetId: budget.supersedesBudgetId,
    approvedAt: budget.approvedAt?.toISOString() ?? null,
    rejectedAt: budget.rejectedAt ? toIsoDateOnly(budget.rejectedAt) : null,
    rejectionReason: budget.rejectionReason,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      planId: item.planId,
      treatmentId: item.treatmentId,
      professionalId: item.professionalId,
      professionalName: item.professionalName,
      planName: item.planName,
      treatmentName: item.treatmentName,
      valueCents: item.valueCents,
      locationType: item.locationType,
      locationLabel: item.locationLabel,
      sessionIndex: item.sessionIndex,
      sessionTotal: item.sessionTotal,
      sortOrder: item.sortOrder,
    })),
  };
}

export function toBudgetSummaryResponse(item: BudgetDetail | BudgetListItem) {
  const budget = item.budget;
  const itemsCount = 'itemsCount' in item ? item.itemsCount : item.items.length;
  const contractEmissionId =
    'contractEmissionId' in item ? item.contractEmissionId : null;
  const contractPatientSignatureStatus =
    'contractPatientSignatureStatus' in item
      ? item.contractPatientSignatureStatus
      : null;
  const contractResponsibleSignatureStatus =
    'contractResponsibleSignatureStatus' in item
      ? item.contractResponsibleSignatureStatus
      : null;
  const contractPatientName =
    'contractPatientName' in item ? item.contractPatientName : null;
  const contractResponsibleName =
    'contractResponsibleName' in item ? item.contractResponsibleName : null;
  const contractPatientSignedAt =
    'contractPatientSignedAt' in item ? item.contractPatientSignedAt : null;
  const contractResponsibleSignedAt =
    'contractResponsibleSignedAt' in item
      ? item.contractResponsibleSignedAt
      : null;
  return {
    id: budget.id,
    patientId: budget.patientId,
    description: budget.description,
    date: toIsoDateOnly(budget.date),
    finalValueCents: budget.finalValueCents,
    status: budget.status,
    responsibleId: budget.responsibleId,
    responsibleName: budget.responsibleName,
    itemsCount,
    contractEmissionId,
    contractPatientSignatureStatus,
    contractResponsibleSignatureStatus,
    contractPatientName,
    contractResponsibleName,
    contractPatientSignedAt,
    contractResponsibleSignedAt,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}
