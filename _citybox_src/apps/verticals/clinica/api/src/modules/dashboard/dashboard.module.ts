import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { PatientsModule } from '../patients/patients.module';
import { PatientBudgetsModule } from '../patients/patient-budgets/patient-budgets.module';
import { PatientTreatmentsModule } from '../patients/patient-treatments/patient-treatments.module';
import { AppointmentsModule } from '../scheduling/appointments/appointments.module';
import { AppointmentCategoriesModule } from '../scheduling/appointment-categories/appointment-categories.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary/get-dashboard-summary.use-case';
import { ListDashboardBirthdaysUseCase } from './application/use-cases/list-dashboard-birthdays/list-dashboard-birthdays.use-case';
import { ListDashboardBudgetsUseCase } from './application/use-cases/list-dashboard-budgets/list-dashboard-budgets.use-case';
import { GetDashboardRevenueAnalysisUseCase } from './application/use-cases/get-dashboard-revenue-analysis/get-dashboard-revenue-analysis.use-case';
import { ListDashboardRevenueDetailsUseCase } from './application/use-cases/list-dashboard-revenue-details/list-dashboard-revenue-details.use-case';
import { GetDashboardPatientsSummaryUseCase } from './application/use-cases/get-dashboard-patients-summary/get-dashboard-patients-summary.use-case';
import { ListDashboardPatientsByMetricUseCase } from './application/use-cases/list-dashboard-patients-by-metric/list-dashboard-patients-by-metric.use-case';
import { GetDashboardSalesGoalsUseCase } from './application/use-cases/get-dashboard-sales-goals/get-dashboard-sales-goals.use-case';
import { UpsertDashboardSalesGoalUseCase } from './application/use-cases/upsert-dashboard-sales-goal/upsert-dashboard-sales-goal.use-case';
import { DashboardRevenueBuilder } from './application/utils/dashboard-revenue.builder';
import { DashboardPatientsQuery } from './application/utils/dashboard-patients.types';
import { DashboardSalesGoalRepository } from './domain/repositories/dashboard-sales-goal.repository.interface';
import { PrismaDashboardPatientsQuery } from './infrastructure/database/prisma-dashboard-patients.query';
import { PrismaDashboardSalesGoalRepository } from './infrastructure/database/prisma-dashboard-sales-goal.repository';
import { GetDashboardSummaryRoute } from './infrastructure/http/routes/get-dashboard-summary/get-dashboard-summary.route';
import { ListDashboardBirthdaysRoute } from './infrastructure/http/routes/list-dashboard-birthdays/list-dashboard-birthdays.route';
import { ListDashboardBudgetsRoute } from './infrastructure/http/routes/list-dashboard-budgets/list-dashboard-budgets.route';
import { GetDashboardRevenueAnalysisRoute } from './infrastructure/http/routes/get-dashboard-revenue-analysis/get-dashboard-revenue-analysis.route';
import { ListDashboardRevenueDetailsRoute } from './infrastructure/http/routes/list-dashboard-revenue-details/list-dashboard-revenue-details.route';
import { GetDashboardPatientsSummaryRoute } from './infrastructure/http/routes/get-dashboard-patients-summary/get-dashboard-patients-summary.route';
import { ListDashboardPatientsRoute } from './infrastructure/http/routes/list-dashboard-patients/list-dashboard-patients.route';
import { GetDashboardBudgetAnalysisStatusUseCase } from './application/use-cases/get-dashboard-budget-analysis-status/get-dashboard-budget-analysis-status.use-case';
import { GetDashboardBudgetAnalysisUseCase } from './application/use-cases/get-dashboard-budget-analysis/get-dashboard-budget-analysis.use-case';
import { ListDashboardBudgetAnalysisDetailsUseCase } from './application/use-cases/list-dashboard-budget-analysis-details/list-dashboard-budget-analysis-details.use-case';
import { GetDashboardPatientAcquisitionUseCase } from './application/use-cases/get-dashboard-patient-acquisition/get-dashboard-patient-acquisition.use-case';
import { ListDashboardPatientAcquisitionDetailsUseCase } from './application/use-cases/list-dashboard-patient-acquisition-details/list-dashboard-patient-acquisition-details.use-case';
import { GetDashboardPatientDemographicsUseCase } from './application/use-cases/get-dashboard-patient-demographics/get-dashboard-patient-demographics.use-case';
import { GetDashboardAppointmentsUseCase } from './application/use-cases/get-dashboard-appointments/get-dashboard-appointments.use-case';
import { ListDashboardAppointmentsDetailsUseCase } from './application/use-cases/list-dashboard-appointments-details/list-dashboard-appointments-details.use-case';
import { ListDashboardCancelledAppointmentTasksUseCase } from './application/use-cases/list-dashboard-cancelled-appointment-tasks/list-dashboard-cancelled-appointment-tasks.use-case';
import { GetDashboardCashflowUseCase } from './application/use-cases/get-dashboard-cashflow/get-dashboard-cashflow.use-case';
import { GetDashboardCommissionsUseCase } from './application/use-cases/get-dashboard-commissions/get-dashboard-commissions.use-case';
import { GetDashboardCommissionsDetailsUseCase } from './application/use-cases/get-dashboard-commissions-details/get-dashboard-commissions-details.use-case';
import { GetDashboardPaymentMethodsUseCase } from './application/use-cases/get-dashboard-payment-methods/get-dashboard-payment-methods.use-case';
import { GetDashboardTicketMedioUseCase } from './application/use-cases/get-dashboard-ticket-medio/get-dashboard-ticket-medio.use-case';
import { GetDashboardInadimplenciaUseCase } from './application/use-cases/get-dashboard-inadimplencia/get-dashboard-inadimplencia.use-case';
import { ListDashboardInadimplenciaDetailsUseCase } from './application/use-cases/list-dashboard-inadimplencia-details/list-dashboard-inadimplencia-details.use-case';
import { GetDashboardExpenseByCategoryUseCase } from './application/use-cases/get-dashboard-expense-by-category/get-dashboard-expense-by-category.use-case';
import { GetDashboardBudgetAnalysisStatusRoute } from './infrastructure/http/routes/get-dashboard-budget-analysis-status/get-dashboard-budget-analysis-status.route';
import { GetDashboardBudgetAnalysisRoute } from './infrastructure/http/routes/get-dashboard-budget-analysis/get-dashboard-budget-analysis.route';
import { ListDashboardBudgetAnalysisDetailsRoute } from './infrastructure/http/routes/list-dashboard-budget-analysis-details/list-dashboard-budget-analysis-details.route';
import { GetDashboardPatientAcquisitionRoute } from './infrastructure/http/routes/get-dashboard-patient-acquisition/get-dashboard-patient-acquisition.route';
import { ListDashboardPatientAcquisitionDetailsRoute } from './infrastructure/http/routes/list-dashboard-patient-acquisition-details/list-dashboard-patient-acquisition-details.route';
import { GetDashboardPatientDemographicsRoute } from './infrastructure/http/routes/get-dashboard-patient-demographics/get-dashboard-patient-demographics.route';
import { GetDashboardAppointmentsRoute } from './infrastructure/http/routes/get-dashboard-appointments/get-dashboard-appointments.route';
import { ListDashboardAppointmentsDetailsRoute } from './infrastructure/http/routes/list-dashboard-appointments-details/list-dashboard-appointments-details.route';
import { ListDashboardCancelledAppointmentTasksRoute } from './infrastructure/http/routes/list-dashboard-cancelled-appointment-tasks/list-dashboard-cancelled-appointment-tasks.route';
import { GetDashboardCashflowRoute } from './infrastructure/http/routes/get-dashboard-cashflow/get-dashboard-cashflow.route';
import { GetDashboardCommissionsRoute } from './infrastructure/http/routes/get-dashboard-commissions/get-dashboard-commissions.route';
import { GetDashboardCommissionsDetailsRoute } from './infrastructure/http/routes/get-dashboard-commissions-details/get-dashboard-commissions-details.route';
import { GetDashboardPaymentMethodsRoute } from './infrastructure/http/routes/get-dashboard-payment-methods/get-dashboard-payment-methods.route';
import { GetDashboardTicketMedioRoute } from './infrastructure/http/routes/get-dashboard-ticket-medio/get-dashboard-ticket-medio.route';
import { GetDashboardInadimplenciaRoute } from './infrastructure/http/routes/get-dashboard-inadimplencia/get-dashboard-inadimplencia.route';
import { ListDashboardInadimplenciaDetailsRoute } from './infrastructure/http/routes/list-dashboard-inadimplencia-details/list-dashboard-inadimplencia-details.route';
import { GetDashboardExpenseByCategoryRoute } from './infrastructure/http/routes/get-dashboard-expense-by-category/get-dashboard-expense-by-category.route';
import { GetDashboardSalesGoalsRoute } from './infrastructure/http/routes/get-dashboard-sales-goals/get-dashboard-sales-goals.route';
import { UpsertDashboardSalesGoalRoute } from './infrastructure/http/routes/upsert-dashboard-sales-goal/upsert-dashboard-sales-goal.route';

@Module({
  imports: [
    PrismaModule,
    FinancialModule,
    PatientBudgetsModule,
    PatientsModule,
    PatientTreatmentsModule,
    AppointmentsModule,
    AppointmentCategoriesModule,
    CommissionsModule,
  ],
  controllers: [
    GetDashboardSummaryRoute,
    ListDashboardBirthdaysRoute,
    ListDashboardBudgetsRoute,
    GetDashboardRevenueAnalysisRoute,
    ListDashboardRevenueDetailsRoute,
    GetDashboardBudgetAnalysisStatusRoute,
    GetDashboardBudgetAnalysisRoute,
    ListDashboardBudgetAnalysisDetailsRoute,
    GetDashboardPatientAcquisitionRoute,
    ListDashboardPatientAcquisitionDetailsRoute,
    GetDashboardPatientDemographicsRoute,
    GetDashboardAppointmentsRoute,
    ListDashboardAppointmentsDetailsRoute,
    ListDashboardCancelledAppointmentTasksRoute,
    GetDashboardCashflowRoute,
    GetDashboardCommissionsRoute,
    GetDashboardCommissionsDetailsRoute,
    GetDashboardPaymentMethodsRoute,
    GetDashboardTicketMedioRoute,
    GetDashboardInadimplenciaRoute,
    ListDashboardInadimplenciaDetailsRoute,
    GetDashboardExpenseByCategoryRoute,
    GetDashboardPatientsSummaryRoute,
    ListDashboardPatientsRoute,
    GetDashboardSalesGoalsRoute,
    UpsertDashboardSalesGoalRoute,
  ],
  providers: [
    GetDashboardSummaryUseCase,
    ListDashboardBirthdaysUseCase,
    ListDashboardBudgetsUseCase,
    GetDashboardRevenueAnalysisUseCase,
    ListDashboardRevenueDetailsUseCase,
    GetDashboardBudgetAnalysisStatusUseCase,
    GetDashboardBudgetAnalysisUseCase,
    ListDashboardBudgetAnalysisDetailsUseCase,
    GetDashboardPatientAcquisitionUseCase,
    ListDashboardPatientAcquisitionDetailsUseCase,
    GetDashboardPatientDemographicsUseCase,
    GetDashboardAppointmentsUseCase,
    ListDashboardAppointmentsDetailsUseCase,
    ListDashboardCancelledAppointmentTasksUseCase,
    GetDashboardCashflowUseCase,
    GetDashboardCommissionsUseCase,
    GetDashboardCommissionsDetailsUseCase,
    GetDashboardPaymentMethodsUseCase,
    GetDashboardTicketMedioUseCase,
    GetDashboardInadimplenciaUseCase,
    ListDashboardInadimplenciaDetailsUseCase,
    GetDashboardExpenseByCategoryUseCase,
    GetDashboardPatientsSummaryUseCase,
    ListDashboardPatientsByMetricUseCase,
    GetDashboardSalesGoalsUseCase,
    UpsertDashboardSalesGoalUseCase,
    DashboardRevenueBuilder,
    {
      provide: DashboardPatientsQuery,
      useClass: PrismaDashboardPatientsQuery,
    },
    {
      provide: DashboardSalesGoalRepository,
      useClass: PrismaDashboardSalesGoalRepository,
    },
  ],
})
export class DashboardModule {}
