import type {
  PatientFinancialDebitAttachment,
  PatientFinancialDebitDetail,
  PatientFinancialDebitTreatment,
  PatientFinancialReceiveDetail,
} from '../../domain/entities/patient-financial-entry.entity';
import type { AvulsoDebitInput } from '../../domain/validators/patient-financial-entry.zod.validator';
import type { ReceiveFinancialEntryInput } from '../../domain/validators/patient-financial-entry.zod.validator';
import type { BudgetItem } from '../../../patient-budgets/domain/entities/budget-item.entity';
import { parseToothLocationLabel } from '../../../../../shared/core/utils/tooth-location-label';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCentsToBrl(cents: number): string {
  return brlFormatter.format(cents / 100);
}

export function buildAvulsoDebitEntryName(
  treatmentName: string,
  patientName: string,
): string {
  const trimmedTreatment = treatmentName.trim();
  const trimmedPatient = patientName.trim();

  if (!trimmedTreatment) {
    return trimmedPatient;
  }

  if (!trimmedPatient) {
    return trimmedTreatment;
  }

  return `${trimmedTreatment} de ${trimmedPatient}`;
}

export function sumTreatmentValueCents(
  treatments: { valueCents: number }[],
): number {
  return treatments.reduce((sum, treatment) => sum + treatment.valueCents, 0);
}

export function buildDebitDetailSnapshot(
  input: AvulsoDebitInput,
  attachments: PatientFinancialDebitAttachment[] = [],
): PatientFinancialDebitDetail {
  const treatments: PatientFinancialDebitTreatment[] = input.treatments.map(
    (treatment) => ({
      id: treatment.id,
      planId: treatment.planId,
      treatmentId: treatment.treatmentId,
      treatmentName: treatment.treatmentName,
      value: formatCentsToBrl(treatment.valueCents),
      professionalId: treatment.professionalId,
      toothNumber: treatment.toothNumber,
    }),
  );

  return {
    observations: input.observations,
    treatments,
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

export function buildDebitDetailFromBudgetItem(
  item: Pick<
    BudgetItem,
    | 'id'
    | 'planId'
    | 'treatmentId'
    | 'treatmentName'
    | 'professionalId'
    | 'locationType'
    | 'locationLabel'
  >,
  valueCents: number,
  observations = '',
): PatientFinancialDebitDetail {
  const toothNumber =
    item.locationType === 'tooth'
      ? (parseToothLocationLabel(item.locationLabel)?.toothNumber ?? null)
      : null;

  return {
    observations,
    treatments: [
      {
        id: item.id,
        planId: item.planId,
        treatmentId: item.treatmentId,
        treatmentName: item.treatmentName,
        value: formatCentsToBrl(valueCents),
        professionalId: item.professionalId,
        toothNumber,
      },
    ],
  };
}

export function buildReceiveDetailSnapshot(
  input: ReceiveFinancialEntryInput,
): PatientFinancialReceiveDetail {
  return {
    paymentMethod: input.paymentMethod,
    paidValueCents: input.paidValueCents,
    cashRegisterId: input.cashRegisterId,
    observations: input.observations,
    ...(input.cardMode ? { cardMode: input.cardMode } : {}),
    ...(input.checkIssueDate
      ? { checkIssueDate: toIsoDateOnly(input.checkIssueDate) }
      : {}),
    ...(input.checkHolderName
      ? { checkHolderName: input.checkHolderName }
      : {}),
    ...(input.checkNumber ? { checkNumber: input.checkNumber } : {}),
    ...(input.checkBank ? { checkBank: input.checkBank } : {}),
    ...(input.checkDocument ? { checkDocument: input.checkDocument } : {}),
  };
}

export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toPublicDebitDetail(
  debitDetail: PatientFinancialDebitDetail | null,
):
  | (Omit<PatientFinancialDebitDetail, 'attachments'> & {
      attachments?: Array<{
        id: string;
        name: string;
        mimeType: string;
        sizeBytes: number;
      }>;
    })
  | undefined {
  if (!debitDetail) {
    return undefined;
  }

  const attachments = debitDetail.attachments?.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
  }));

  return {
    observations: debitDetail.observations,
    treatments: debitDetail.treatments,
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };
}
