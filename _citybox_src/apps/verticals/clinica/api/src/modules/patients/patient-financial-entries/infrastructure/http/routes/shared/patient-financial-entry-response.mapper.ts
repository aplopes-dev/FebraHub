import type { PatientFinancialEntry } from '../../../../domain/entities/patient-financial-entry.entity';
import {
  toIsoDateOnly,
  toPublicDebitDetail,
} from '../../../../application/utils/patient-financial-entry.utils';
import type { AvulsoDebitInput } from '../../../../domain/validators/patient-financial-entry.zod.validator';
import type { ReceiveFinancialEntryInput } from '../../../../domain/validators/patient-financial-entry.zod.validator';
import type {
  PatientFinancialAvulsoDebitBodyDto,
  ReceivePatientFinancialEntryBodyDto,
} from './patient-financial-entry-body.dto';

export function toAvulsoDebitInput(
  body: PatientFinancialAvulsoDebitBodyDto,
): AvulsoDebitInput {
  return {
    dueDate: new Date(body.dueDate),
    observations: body.observations,
    treatments: body.treatments,
  };
}

export function toReceiveFinancialEntryInput(
  body: ReceivePatientFinancialEntryBodyDto,
): ReceiveFinancialEntryInput {
  return {
    paymentMethod: body.paymentMethod,
    paidValueCents: body.paidValueCents,
    receivedAt: new Date(body.receivedAt),
    cashRegisterId: body.cashRegisterId,
    observations: body.observations,
    ...(body.cardMode ? { cardMode: body.cardMode } : {}),
    ...(body.checkIssueDate
      ? { checkIssueDate: new Date(body.checkIssueDate) }
      : {}),
    ...(body.checkHolderName ? { checkHolderName: body.checkHolderName } : {}),
    ...(body.checkNumber ? { checkNumber: body.checkNumber } : {}),
    ...(body.checkBank ? { checkBank: body.checkBank } : {}),
    ...(body.checkDocument ? { checkDocument: body.checkDocument } : {}),
  };
}

export function toPatientFinancialEntrySummaryResponse(
  entry: PatientFinancialEntry,
) {
  const debitDetail = toPublicDebitDetail(entry.debitDetail);

  return {
    id: entry.id,
    patientId: entry.patientId,
    date: toIsoDateOnly(entry.date),
    name: entry.name,
    valueCents: entry.valueCents,
    status: entry.status,
    source: entry.source,
    budgetId: entry.budgetId,
    budgetItemId: entry.budgetItemId,
    ...(entry.receivedAt
      ? { receivedAt: toIsoDateOnly(entry.receivedAt) }
      : {}),
    ...(entry.receiveDetail?.paymentMethod
      ? { paymentMethod: entry.receiveDetail.paymentMethod }
      : {}),
    ...(debitDetail ? { debitDetail } : {}),
  };
}

export function toPatientFinancialEntryDetailResponse(
  entry: PatientFinancialEntry,
) {
  return {
    ...toPatientFinancialEntrySummaryResponse(entry),
    ...(entry.receiveDetail ? { receiveDetail: entry.receiveDetail } : {}),
  };
}
