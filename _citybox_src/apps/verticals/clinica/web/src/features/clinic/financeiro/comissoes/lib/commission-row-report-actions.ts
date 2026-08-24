'use client';

import { toast } from 'sonner';
import {
  downloadPatientDocumentPdf,
  printPatientDocumentPdf,
} from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { mapClinicSettingsToPdfClinic } from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import {
  buildCommissionReportPdf,
  buildCommissionReportPdfFileName,
} from './build-commission-report-pdf';
import type { PeriodDateRange } from './filter-commissions-by-period';
import type { CommissionSummaryRow } from '../types/commission-financial.types';

type CommissionRowReportMode = 'open' | 'history';

type CommissionRowReportInput = {
  row: CommissionSummaryRow;
  mode: CommissionRowReportMode;
  periodRange: PeriodDateRange;
  storeId?: string;
};

async function buildCommissionRowReportBlob(input: CommissionRowReportInput) {
  const clinic = input.storeId
    ? mapClinicSettingsToPdfClinic(await getClinicProfile(input.storeId))
    : undefined;
  return buildCommissionReportPdf({
    row: input.row,
    mode: input.mode,
    periodRange: input.periodRange,
    clinic,
  });
}

export async function printCommissionRowReport(
  input: CommissionRowReportInput,
): Promise<void> {
  try {
    const blob = await buildCommissionRowReportBlob(input);
    printPatientDocumentPdf(blob);
  } catch {
    toast.error('Não foi possível gerar o PDF para impressão.');
  }
}

export async function exportCommissionRowReport(
  input: CommissionRowReportInput,
): Promise<void> {
  try {
    const blob = await buildCommissionRowReportBlob(input);
    downloadPatientDocumentPdf(
      blob,
      buildCommissionReportPdfFileName(input.row.professionalName, input.periodRange),
    );
  } catch {
    toast.error('Não foi possível exportar o relatório de comissões.');
  }
}
