import {
  formatCentsToBrlInput,
  parseBrlCurrencyToCents,
  parsePercentDiscountValue,
  parsePositiveInteger,
} from './patient-budget-form-utils';
import { parseToothLocationLabel } from './tooth-location-label';
import type {
  PatientBudgetDiscount,
  PatientBudgetInstallment,
  PatientBudgetSheetSubmitPayload,
  PatientBudgetTreatmentItem,
} from '../types/patient-budget-form';
import type { PatientBudget, PatientBudgetStatus } from '../types/patient-budget';
import type {
  PatientBudgetApiDetail,
  PatientBudgetApiDiscount,
  PatientBudgetApiStatus,
  PatientBudgetApiSummary,
  PatientBudgetUpsertBody,
} from '../types/patient-budget-api';

function parseToothNumberFromLocation(
  locationType: PatientBudgetTreatmentItem['locationType'],
  locationLabel: string,
): number | undefined {
  if (locationType !== 'tooth' || !locationLabel.trim()) {
    return undefined;
  }

  const parsed = parseToothLocationLabel(locationLabel);
  return parsed?.toothNumber;
}

function resolveTreatmentLocation(item: PatientBudgetTreatmentItem): {
  locationType: 'tooth' | 'body_region' | 'session' | 'none';
  locationLabel: string;
} {
  if (item.locationType) {
    if (item.locationType === 'tooth') {
      const fromLabel = item.locationLabel?.trim();
      if (fromLabel) {
        return {
          locationType: 'tooth',
          locationLabel: fromLabel,
        };
      }

      return {
        locationType: 'tooth',
        locationLabel: item.toothNumber ? String(item.toothNumber) : '',
      };
    }

    return {
      locationType: item.locationType,
      locationLabel: item.locationLabel ?? '',
    };
  }

  if (item.toothNumber) {
    return {
      locationType: 'tooth',
      locationLabel: String(item.toothNumber),
    };
  }

  return {
    locationType: 'none',
    locationLabel: '',
  };
}

export function mapApiBudgetStatusToUi(status: PatientBudgetApiStatus): PatientBudgetStatus {
  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'draft';
}

export function mapUiBudgetStatusToApi(status: PatientBudgetStatus): PatientBudgetApiStatus {
  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'pending';
}

export function mapApiDiscountToUi(
  discount: PatientBudgetApiDiscount | null,
): PatientBudgetDiscount | null {
  if (!discount) {
    return null;
  }

  if (discount.type === 'fixed') {
    return {
      type: 'fixed',
      value: formatCentsToBrlInput(discount.value),
    };
  }

  return {
    type: 'percent',
    value: String(discount.value / 100),
  };
}

export function mapUiDiscountToApi(
  discount: PatientBudgetDiscount | null,
): PatientBudgetApiDiscount | null {
  if (!discount) {
    return null;
  }

  if (discount.type === 'fixed') {
    return {
      type: 'fixed',
      value: parseBrlCurrencyToCents(discount.value),
    };
  }

  const percent = parsePercentDiscountValue(discount.value);
  return {
    type: 'percent',
    value: Math.round(percent * 100),
  };
}

function mapApiInstallmentToUi(
  installment: PatientBudgetApiDetail['installment'],
): PatientBudgetInstallment {
  return {
    enabled: installment.enabled,
    downPayment: formatCentsToBrlInput(installment.downPaymentCents),
    installmentsCount:
      installment.installmentsCount > 0 ? String(installment.installmentsCount) : '',
  };
}

export function mapApiBudgetItemToUi(item: PatientBudgetApiDetail['items'][number]): PatientBudgetTreatmentItem {
  const locationType = item.locationType;
  const toothNumber = parseToothNumberFromLocation(locationType, item.locationLabel);

  return {
    id: item.id,
    toothNumber: toothNumber ?? 0,
    locationType,
    locationLabel: item.locationLabel,
    sessionIndex: item.sessionIndex ?? null,
    sessionTotal: item.sessionTotal ?? null,
    treatmentId: item.treatmentId,
    treatmentName: item.treatmentName,
    professionalId: item.professionalId,
    professionalName: item.professionalName,
    planId: item.planId,
    planName: item.planName,
    valueCents: item.valueCents,
  };
}

export function toPatientBudget(detail: PatientBudgetApiDetail): PatientBudget {
  return {
    id: detail.id,
    patientId: detail.patientId,
    date: detail.date,
    description: detail.description,
    finalValueCents: detail.finalValueCents,
    status: mapApiBudgetStatusToUi(detail.status),
    responsibleId: detail.responsibleId,
    responsible: detail.responsibleName,
    treatments: detail.items.map(mapApiBudgetItemToUi),
    observations: detail.observations,
    discount: mapApiDiscountToUi(detail.discount),
    installment: mapApiInstallmentToUi(detail.installment),
    rejectedAt: detail.rejectedAt,
    rejectionReason: detail.rejectionReason,
    itemsCount: detail.items.length,
  };
}

export function toPatientBudgetSummary(summary: PatientBudgetApiSummary): PatientBudget {
  return {
    id: summary.id,
    patientId: summary.patientId,
    date: summary.date,
    description: summary.description,
    finalValueCents: summary.finalValueCents,
    status: mapApiBudgetStatusToUi(summary.status),
    responsibleId: summary.responsibleId,
    responsible: summary.responsibleName,
    treatments: [],
    observations: '',
    discount: null,
    installment: {
      enabled: false,
      downPayment: formatCentsToBrlInput(0),
      installmentsCount: '',
    },
    itemsCount: summary.itemsCount,
    contractEmissionId: summary.contractEmissionId ?? null,
    contractPatientSignatureStatus: summary.contractPatientSignatureStatus ?? null,
    contractResponsibleSignatureStatus:
      summary.contractResponsibleSignatureStatus ?? null,
    contractPatientName: summary.contractPatientName ?? null,
    contractResponsibleName: summary.contractResponsibleName ?? null,
    contractPatientSignedAt: summary.contractPatientSignedAt ?? null,
    contractResponsibleSignedAt: summary.contractResponsibleSignedAt ?? null,
  };
}

export function toPatientBudgetUpsertBody(
  payload: PatientBudgetSheetSubmitPayload,
): PatientBudgetUpsertBody {
  const installmentEnabled = payload.installmentConfig.enabled;
  const downPaymentCents = installmentEnabled
    ? (payload.installment?.downPaymentCents ?? parseBrlCurrencyToCents(payload.installmentConfig.downPayment))
    : 0;
  const installmentsCount = installmentEnabled
    ? (payload.installment?.installmentsCount ??
      parsePositiveInteger(payload.installmentConfig.installmentsCount))
    : 0;

  return {
    description: payload.description,
    date: payload.date,
    observations: payload.observations,
    responsibleId: payload.responsibleId,
    responsibleName: payload.responsible,
    discount: mapUiDiscountToApi(payload.discount),
    installmentEnabled,
    downPaymentCents,
    installmentsCount,
    items: payload.treatments.map((item, index) => {
      const location = resolveTreatmentLocation(item);

      return {
        planId: item.planId,
        treatmentId: item.treatmentId,
        professionalId: item.professionalId,
        professionalName: item.professionalName,
        valueCents: item.valueCents,
        locationType: location.locationType,
        locationLabel: location.locationLabel,
        sessionIndex: item.sessionTotal != null && item.sessionTotal >= 2 ? item.sessionIndex ?? null : null,
        sessionTotal: item.sessionTotal != null && item.sessionTotal >= 2 ? item.sessionTotal : null,
        sortOrder: index,
      };
    }),
  };
}

export function toPatientBudgetDuplicateBody(
  detail: PatientBudgetApiDetail,
  description: string,
): PatientBudgetUpsertBody {
  const budget = toPatientBudget(detail);

  return toPatientBudgetUpsertBody({
    description,
    responsibleId: budget.responsibleId,
    responsible: budget.responsible,
    date: detail.date,
    treatments: budget.treatments,
    finalValueCents: budget.finalValueCents,
    observations: budget.observations,
    discount: budget.discount,
    installmentConfig: budget.installment,
    installment: detail.installment.enabled
      ? {
          downPaymentCents: detail.installment.downPaymentCents,
          installmentsCount: detail.installment.installmentsCount,
          balanceCents: 0,
          installmentAmountCents: 0,
        }
      : null,
    status: 'draft',
    rejection: null,
    emitContractOnApprove: false,
    printSettings: {
      totalValue: true,
      treatmentValues: true,
      installments: true,
      dentist: true,
    },
  });
}
