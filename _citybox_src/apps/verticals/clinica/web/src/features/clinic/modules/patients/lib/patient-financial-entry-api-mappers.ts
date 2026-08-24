import { parseBrlCurrencyToCents } from './patient-budget-form-utils';
import { formatCentsToBrlInput } from './patient-budget-form-utils';
import { toIsoDateOnly } from './patient-document-date';
import { isPatientFinancialPaymentMethod } from './patient-financial-receive-payment-methods';
import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';
import type { PatientFinancialReceiveFormValues } from '../types/patient-financial-receive-form';
import type {
  PatientFinancialAvulsoDebitBody,
  PatientFinancialEntryApiDetail,
  PatientFinancialEntryApiSummary,
  PatientFinancialReceiveBody,
  PatientFinancialUpdatePendingDebitBody,
} from '../types/patient-financial-entry-api';

export function toPatientFinancialEntry(
  api: PatientFinancialEntryApiSummary | PatientFinancialEntryApiDetail,
): PatientFinancialEntry {
  const paymentMethodFromSummary =
    'paymentMethod' in api && typeof api.paymentMethod === 'string'
      ? api.paymentMethod
      : undefined;
  const paymentMethodFromDetail =
    'receiveDetail' in api ? api.receiveDetail?.paymentMethod : undefined;
  const paymentMethodRaw = paymentMethodFromSummary ?? paymentMethodFromDetail;

  return {
    id: api.id,
    patientId: api.patientId,
    date: api.date,
    name: api.name,
    valueCents: api.valueCents,
    status: api.status,
    source: api.source,
    budgetId: api.budgetId ?? null,
    budgetItemId: api.budgetItemId ?? null,
    ...(api.receivedAt ? { receivedAt: api.receivedAt } : {}),
    ...(isPatientFinancialPaymentMethod(paymentMethodRaw)
      ? { paymentMethod: paymentMethodRaw }
      : {}),
    ...(api.debitDetail
      ? {
          debitDetail: {
            observations: api.debitDetail.observations,
            treatments: api.debitDetail.treatments.map((treatment) => ({
              id: treatment.id,
              planId: treatment.planId,
              treatmentId: treatment.treatmentId,
              treatmentName: treatment.treatmentName,
              value: treatment.value,
              professionalId: treatment.professionalId,
              toothNumber: treatment.toothNumber,
            })),
            ...(api.debitDetail.attachments?.length
              ? {
                  attachments: api.debitDetail.attachments.map((attachment) => ({
                    id: attachment.id,
                    name: attachment.name,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.sizeBytes,
                  })),
                }
              : {}),
          },
        }
      : {}),
  };
}

export function toAvulsoDebitBody(
  values: PatientFinancialDebitFormValues,
): PatientFinancialAvulsoDebitBody {
  if (!values.dueDate) {
    throw new Error('dueDate is required');
  }

  return {
    dueDate: toIsoDateOnly(values.dueDate),
    observations: values.observations,
    treatments: values.treatments.map((treatment) => ({
      id: treatment.id,
      planId: treatment.planId,
      treatmentId: treatment.treatmentId,
      treatmentName: treatment.treatmentName,
      valueCents: parseBrlCurrencyToCents(treatment.value),
      professionalId: treatment.professionalId,
      toothNumber: treatment.toothNumber,
    })),
  };
}

export function toUpdatePendingDebitBody(
  values: PatientFinancialDebitFormValues,
): PatientFinancialUpdatePendingDebitBody {
  if (values.treatments.length > 0) {
    return {
      observations: values.observations,
      treatments: values.treatments.map((treatment) => ({
        id: treatment.id,
        valueCents: parseBrlCurrencyToCents(treatment.value),
        professionalId: treatment.professionalId,
      })),
    };
  }

  return {
    observations: values.observations,
    valueCents: parseBrlCurrencyToCents(values.installmentValue),
  };
}

export function toReceiveBody(
  values: PatientFinancialReceiveFormValues,
): PatientFinancialReceiveBody {
  if (!values.receivedDate) {
    throw new Error('receivedDate is required');
  }

  return {
    paymentMethod: values.paymentMethod,
    paidValueCents: parseBrlCurrencyToCents(values.paidAmount),
    receivedAt: toIsoDateOnly(values.receivedDate),
    cashRegisterId: values.cashRegisterId,
    observations: values.observations,
    ...(values.paymentMethod === 'credit' || values.paymentMethod === 'debit'
      ? { cardMode: values.cardMode }
      : {}),
    ...(values.paymentMethod === 'check' && values.checkIssueDate
      ? { checkIssueDate: toIsoDateOnly(values.checkIssueDate) }
      : {}),
    ...(values.paymentMethod === 'check' && values.checkHolderName
      ? { checkHolderName: values.checkHolderName }
      : {}),
    ...(values.paymentMethod === 'check' && values.checkNumber
      ? { checkNumber: values.checkNumber }
      : {}),
    ...(values.paymentMethod === 'check' && values.checkBank
      ? { checkBank: values.checkBank }
      : {}),
    ...(values.paymentMethod === 'check' && values.checkDocument
      ? { checkDocument: values.checkDocument }
      : {}),
  };
}

export { formatCentsToBrlInput };
