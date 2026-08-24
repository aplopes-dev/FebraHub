'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@citybox/ui/atoms';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { mapClinicSettingsToPdfClinic } from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { useStore } from '@/lib/store-context';
import { DashboardPageFrame } from '../components/dashboard-page-frame';
import { ReportsCatalogAccordion } from '../reports/components/reports-catalog-accordion';
import { ReportsHeader } from '../reports/components/reports-header';
import { ReportsTablePanel } from '../reports/components/reports-table-panel';
import {
  DEFAULT_REPORT_ID,
  getReportFilterKind,
  getReportLabel,
} from '../reports/lib/reports-catalog';
import {
  buildReportsApprovedBudgetsPdf,
  buildReportsApprovedBudgetsPdfFileName,
} from '../reports/lib/build-reports-approved-budgets-pdf';
import {
  buildReportsBirthdaysPdf,
  buildReportsBirthdaysPdfFileName,
} from '../reports/lib/build-reports-birthdays-pdf';
import {
  buildReportsOpenBudgetsPdf,
  buildReportsOpenBudgetsPdfFileName,
} from '../reports/lib/build-reports-open-budgets-pdf';
import {
  buildReportsOpenTreatmentsPdf,
  buildReportsOpenTreatmentsPdfFileName,
} from '../reports/lib/build-reports-open-treatments-pdf';
import {
  buildReportsRejectedBudgetsPdf,
  buildReportsRejectedBudgetsPdfFileName,
} from '../reports/lib/build-reports-rejected-budgets-pdf';
import {
  buildReportsSalesBySpecialtyPdf,
  buildReportsSalesBySpecialtyPdfFileName,
} from '../reports/lib/build-reports-sales-by-specialty-pdf';
import {
  buildReportsSalesByPlanPdf,
  buildReportsSalesByPlanPdfFileName,
} from '../reports/lib/build-reports-sales-by-plan-pdf';
import {
  buildReportsSalesByProfessionalPdf,
  buildReportsSalesByProfessionalPdfFileName,
} from '../reports/lib/build-reports-sales-by-professional-pdf';
import {
  buildReportsSalesByTreatmentPdf,
  buildReportsSalesByTreatmentPdfFileName,
} from '../reports/lib/build-reports-sales-by-treatment-pdf';
import {
  buildReportsExpensesByCategoryPdf,
  buildReportsExpensesByCategoryPdfFileName,
} from '../reports/lib/build-reports-expenses-by-category-pdf';
import {
  buildReportsExcludedRevenuesPdf,
  buildReportsExcludedRevenuesPdfFileName,
} from '../reports/lib/build-reports-excluded-revenues-pdf';
import {
  buildReportsReferredPatientsPdf,
  buildReportsReferredPatientsPdfFileName,
} from '../reports/lib/build-reports-referred-patients-pdf';
import {
  DEFAULT_REPORT_BUDGET_MONTH,
  DEFAULT_REPORT_BUDGET_PERIOD_MODE,
  DEFAULT_REPORT_BUDGET_YEAR,
  DEFAULT_REPORT_PERIOD,
  formatReportBirthdayPdfPeriodLabel,
  formatReportBudgetPeriodLabel,
  REPORT_PERIOD_OPTIONS,
  resolveReportBirthdayRange,
  resolveReportBudgetPeriodRange,
} from '../reports/lib/reports-period';
import { listAllReportApprovedBudgets } from '../reports/services/reports-approved-budgets.service';
import { listAllReportBirthdays } from '../reports/services/reports-birthdays.service';
import { listAllReportOpenBudgets } from '../reports/services/reports-open-budgets.service';
import { listAllReportOpenTreatmentsWithoutAppointment } from '../reports/services/reports-open-treatments.service';
import { listAllReportRejectedBudgets } from '../reports/services/reports-rejected-budgets.service';
import { listAllReportSalesBySpecialty } from '../reports/services/reports-sales-by-specialty.service';
import { listAllReportSalesByPlan } from '../reports/services/reports-sales-by-plan.service';
import { listAllReportSalesByProfessional } from '../reports/services/reports-sales-by-professional.service';
import { listAllReportSalesByTreatment } from '../reports/services/reports-sales-by-treatment.service';
import { listAllReportExpensesByCategory } from '../reports/services/reports-expenses-by-category.service';
import { listAllReportExcludedRevenues } from '../reports/services/reports-excluded-revenues.service';
import { listAllReportReferredPatients } from '../reports/services/reports-referred-patients.service';
import type {
  ReportBudgetPeriodMode,
  ReportId,
  ReportPeriodFilter,
} from '../reports/types/clinic-reports';

export function ClinicReportsPage() {
  const { storeId } = useStore();
  const [selectedReportId, setSelectedReportId] =
    useState<ReportId>(DEFAULT_REPORT_ID);
  const [period, setPeriod] =
    useState<ReportPeriodFilter>(DEFAULT_REPORT_PERIOD);
  const [budgetPeriodMode, setBudgetPeriodMode] =
    useState<ReportBudgetPeriodMode>(DEFAULT_REPORT_BUDGET_PERIOD_MODE);
  const [budgetMonth, setBudgetMonth] = useState(DEFAULT_REPORT_BUDGET_MONTH);
  const [budgetYear, setBudgetYear] = useState(DEFAULT_REPORT_BUDGET_YEAR);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBirthdays = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBirthdayRange(period);
      const [rows, clinicProfile] = await Promise.all([
        listAllReportBirthdays(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
          status: 'active',
        }),
        getClinicProfile(storeId),
      ]);
      const blob = await buildReportsBirthdaysPdf({
        rows,
        periodLabel: formatReportBirthdayPdfPeriodLabel(period),
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildReportsBirthdaysPdfFileName());
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOpenTreatments = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const [rows, clinicProfile] = await Promise.all([
        listAllReportOpenTreatmentsWithoutAppointment(storeId, {
          status: 'active',
        }),
        getClinicProfile(storeId),
      ]);
      const blob = await buildReportsOpenTreatmentsPdf({
        rows,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsOpenTreatmentsPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportApprovedBudgets = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportApprovedBudgets(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsApprovedBudgetsPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsApprovedBudgetsPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOpenBudgets = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportOpenBudgets(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsOpenBudgetsPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildReportsOpenBudgetsPdfFileName());
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRejectedBudgets = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportRejectedBudgets(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsRejectedBudgetsPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsRejectedBudgetsPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSalesBySpecialty = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportSalesBySpecialty(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsSalesBySpecialtyPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsSalesBySpecialtyPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSalesByPlan = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportSalesByPlan(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsSalesByPlanPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildReportsSalesByPlanPdfFileName());
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSalesByProfessional = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportSalesByProfessional(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsSalesByProfessionalPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsSalesByProfessionalPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSalesByTreatment = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportSalesByTreatment(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsSalesByTreatmentPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsSalesByTreatmentPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExpensesByCategory = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportExpensesByCategory(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsExpensesByCategoryPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsExpensesByCategoryPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcludedRevenues = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBirthdayRange(period);
      const [rows, clinicProfile] = await Promise.all([
        listAllReportExcludedRevenues(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBirthdayPdfPeriodLabel(period);
      const blob = await buildReportsExcludedRevenuesPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsExcludedRevenuesPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReferredPatients = async () => {
    if (!storeId) {
      toast.error('Loja não selecionada');
      return;
    }

    setIsExporting(true);
    try {
      const range = resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const [rows, clinicProfile] = await Promise.all([
        listAllReportReferredPatients(storeId, {
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getClinicProfile(storeId),
      ]);
      const periodLabel = formatReportBudgetPeriodLabel({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      });
      const blob = await buildReportsReferredPatientsPdf({
        rows,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildReportsReferredPatientsPdfFileName(),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportHandler =
    selectedReportId === 'birthdays'
      ? handleExportBirthdays
      : selectedReportId === 'open_treatments_without_appointment'
        ? handleExportOpenTreatments
        : selectedReportId === 'approved_budgets'
          ? handleExportApprovedBudgets
          : selectedReportId === 'open_budgets'
            ? handleExportOpenBudgets
            : selectedReportId === 'rejected_budgets'
              ? handleExportRejectedBudgets
              : selectedReportId === 'sales_by_specialty'
                ? handleExportSalesBySpecialty
                : selectedReportId === 'sales_by_plan'
                  ? handleExportSalesByPlan
                  : selectedReportId === 'sales_by_professional'
                    ? handleExportSalesByProfessional
                    : selectedReportId === 'sales_by_treatment'
                      ? handleExportSalesByTreatment
                      : selectedReportId === 'expenses_by_category'
                        ? handleExportExpensesByCategory
                        : selectedReportId === 'excluded_revenues'
                          ? handleExportExcludedRevenues
                          : selectedReportId === 'referred_patients'
                            ? handleExportReferredPatients
                            : undefined;

  return (
    <DashboardPageFrame contentClassName="pt-3">
      <Card className="gap-0 py-0">
        <CardContent className="space-y-4 p-4">
          <ReportsHeader
            title="Relatórios"
            description={getReportLabel(selectedReportId)}
            filterKind={getReportFilterKind(selectedReportId)}
            period={period}
            onPeriodChange={setPeriod}
            budgetPeriodMode={budgetPeriodMode}
            onBudgetPeriodModeChange={setBudgetPeriodMode}
            budgetMonth={budgetMonth}
            onBudgetMonthChange={setBudgetMonth}
            budgetYear={budgetYear}
            onBudgetYearChange={setBudgetYear}
            onExport={exportHandler}
            isExporting={isExporting}
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)] lg:items-start">
            <aside className="min-w-0">
              <ReportsCatalogAccordion
                selectedReportId={selectedReportId}
                onSelectReport={setSelectedReportId}
              />
            </aside>
            <div className="min-w-0">
              <ReportsTablePanel
                reportId={selectedReportId}
                period={period}
                budgetPeriodMode={budgetPeriodMode}
                budgetMonth={budgetMonth}
                budgetYear={budgetYear}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardPageFrame>
  );
}
