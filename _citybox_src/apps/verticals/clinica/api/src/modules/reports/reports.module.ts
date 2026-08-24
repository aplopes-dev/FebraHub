import { Module } from '@nestjs/common';
import { ReportApprovedBudgetsRepository } from './domain/repositories/report-approved-budgets.repository';
import { ReportBirthdaysRepository } from './domain/repositories/report-birthdays.repository';
import { ReportExcludedRevenuesRepository } from './domain/repositories/report-excluded-revenues.repository';
import { ReportExpensesByCategoryRepository } from './domain/repositories/report-expenses-by-category.repository';
import { ReportOpenBudgetsRepository } from './domain/repositories/report-open-budgets.repository';
import { ReportOpenTreatmentsRepository } from './domain/repositories/report-open-treatments.repository';
import { ReportReferredPatientsRepository } from './domain/repositories/report-referred-patients.repository';
import { ReportRejectedBudgetsRepository } from './domain/repositories/report-rejected-budgets.repository';
import { ReportSalesByPlanRepository } from './domain/repositories/report-sales-by-plan.repository';
import { ReportSalesByProfessionalRepository } from './domain/repositories/report-sales-by-professional.repository';
import { ReportSalesBySpecialtyRepository } from './domain/repositories/report-sales-by-specialty.repository';
import { ReportSalesByTreatmentRepository } from './domain/repositories/report-sales-by-treatment.repository';
import { ListReportApprovedBudgetsUseCase } from './application/use-cases/list-report-approved-budgets/list-report-approved-budgets.use-case';
import { ListReportBirthdaysUseCase } from './application/use-cases/list-report-birthdays/list-report-birthdays.use-case';
import { ListReportExcludedRevenuesUseCase } from './application/use-cases/list-report-excluded-revenues/list-report-excluded-revenues.use-case';
import { ListReportExpensesByCategoryUseCase } from './application/use-cases/list-report-expenses-by-category/list-report-expenses-by-category.use-case';
import { ListReportOpenBudgetsUseCase } from './application/use-cases/list-report-open-budgets/list-report-open-budgets.use-case';
import { ListReportOpenTreatmentsWithoutAppointmentUseCase } from './application/use-cases/list-report-open-treatments-without-appointment/list-report-open-treatments-without-appointment.use-case';
import { ListReportReferredPatientsUseCase } from './application/use-cases/list-report-referred-patients/list-report-referred-patients.use-case';
import { ListReportRejectedBudgetsUseCase } from './application/use-cases/list-report-rejected-budgets/list-report-rejected-budgets.use-case';
import { ListReportSalesByPlanUseCase } from './application/use-cases/list-report-sales-by-plan/list-report-sales-by-plan.use-case';
import { ListReportSalesByProfessionalUseCase } from './application/use-cases/list-report-sales-by-professional/list-report-sales-by-professional.use-case';
import { ListReportSalesBySpecialtyUseCase } from './application/use-cases/list-report-sales-by-specialty/list-report-sales-by-specialty.use-case';
import { ListReportSalesByTreatmentUseCase } from './application/use-cases/list-report-sales-by-treatment/list-report-sales-by-treatment.use-case';
import { PrismaReportApprovedBudgetsRepository } from './infrastructure/database/prisma-report-approved-budgets.repository';
import { PrismaReportBirthdaysRepository } from './infrastructure/database/prisma-report-birthdays.repository';
import { PrismaReportExcludedRevenuesRepository } from './infrastructure/database/prisma-report-excluded-revenues.repository';
import { PrismaReportExpensesByCategoryRepository } from './infrastructure/database/prisma-report-expenses-by-category.repository';
import { PrismaReportOpenBudgetsRepository } from './infrastructure/database/prisma-report-open-budgets.repository';
import { PrismaReportOpenTreatmentsRepository } from './infrastructure/database/prisma-report-open-treatments.repository';
import { PrismaReportReferredPatientsRepository } from './infrastructure/database/prisma-report-referred-patients.repository';
import { PrismaReportRejectedBudgetsRepository } from './infrastructure/database/prisma-report-rejected-budgets.repository';
import { PrismaReportSalesByPlanRepository } from './infrastructure/database/prisma-report-sales-by-plan.repository';
import { PrismaReportSalesByProfessionalRepository } from './infrastructure/database/prisma-report-sales-by-professional.repository';
import { PrismaReportSalesBySpecialtyRepository } from './infrastructure/database/prisma-report-sales-by-specialty.repository';
import { PrismaReportSalesByTreatmentRepository } from './infrastructure/database/prisma-report-sales-by-treatment.repository';
import { ListReportApprovedBudgetsRoute } from './infrastructure/http/routes/list-report-approved-budgets/list-report-approved-budgets.route';
import { ListReportBirthdaysRoute } from './infrastructure/http/routes/list-report-birthdays/list-report-birthdays.route';
import { ListReportExcludedRevenuesRoute } from './infrastructure/http/routes/list-report-excluded-revenues/list-report-excluded-revenues.route';
import { ListReportExpensesByCategoryRoute } from './infrastructure/http/routes/list-report-expenses-by-category/list-report-expenses-by-category.route';
import { ListReportOpenBudgetsRoute } from './infrastructure/http/routes/list-report-open-budgets/list-report-open-budgets.route';
import { ListReportOpenTreatmentsWithoutAppointmentRoute } from './infrastructure/http/routes/list-report-open-treatments-without-appointment/list-report-open-treatments-without-appointment.route';
import { ListReportReferredPatientsRoute } from './infrastructure/http/routes/list-report-referred-patients/list-report-referred-patients.route';
import { ListReportRejectedBudgetsRoute } from './infrastructure/http/routes/list-report-rejected-budgets/list-report-rejected-budgets.route';
import { ListReportSalesByPlanRoute } from './infrastructure/http/routes/list-report-sales-by-plan/list-report-sales-by-plan.route';
import { ListReportSalesByProfessionalRoute } from './infrastructure/http/routes/list-report-sales-by-professional/list-report-sales-by-professional.route';
import { ListReportSalesBySpecialtyRoute } from './infrastructure/http/routes/list-report-sales-by-specialty/list-report-sales-by-specialty.route';
import { ListReportSalesByTreatmentRoute } from './infrastructure/http/routes/list-report-sales-by-treatment/list-report-sales-by-treatment.route';

@Module({
  controllers: [
    ListReportBirthdaysRoute,
    ListReportOpenTreatmentsWithoutAppointmentRoute,
    ListReportApprovedBudgetsRoute,
    ListReportOpenBudgetsRoute,
    ListReportRejectedBudgetsRoute,
    ListReportSalesBySpecialtyRoute,
    ListReportSalesByPlanRoute,
    ListReportSalesByProfessionalRoute,
    ListReportSalesByTreatmentRoute,
    ListReportExpensesByCategoryRoute,
    ListReportExcludedRevenuesRoute,
    ListReportReferredPatientsRoute,
  ],
  providers: [
    { provide: ReportBirthdaysRepository, useClass: PrismaReportBirthdaysRepository },
    {
      provide: ReportOpenTreatmentsRepository,
      useClass: PrismaReportOpenTreatmentsRepository,
    },
    {
      provide: ReportApprovedBudgetsRepository,
      useClass: PrismaReportApprovedBudgetsRepository,
    },
    {
      provide: ReportOpenBudgetsRepository,
      useClass: PrismaReportOpenBudgetsRepository,
    },
    {
      provide: ReportRejectedBudgetsRepository,
      useClass: PrismaReportRejectedBudgetsRepository,
    },
    {
      provide: ReportSalesBySpecialtyRepository,
      useClass: PrismaReportSalesBySpecialtyRepository,
    },
    {
      provide: ReportSalesByPlanRepository,
      useClass: PrismaReportSalesByPlanRepository,
    },
    {
      provide: ReportSalesByProfessionalRepository,
      useClass: PrismaReportSalesByProfessionalRepository,
    },
    {
      provide: ReportSalesByTreatmentRepository,
      useClass: PrismaReportSalesByTreatmentRepository,
    },
    {
      provide: ReportExpensesByCategoryRepository,
      useClass: PrismaReportExpensesByCategoryRepository,
    },
    {
      provide: ReportExcludedRevenuesRepository,
      useClass: PrismaReportExcludedRevenuesRepository,
    },
    {
      provide: ReportReferredPatientsRepository,
      useClass: PrismaReportReferredPatientsRepository,
    },
    ListReportBirthdaysUseCase,
    ListReportOpenTreatmentsWithoutAppointmentUseCase,
    ListReportApprovedBudgetsUseCase,
    ListReportOpenBudgetsUseCase,
    ListReportRejectedBudgetsUseCase,
    ListReportSalesBySpecialtyUseCase,
    ListReportSalesByPlanUseCase,
    ListReportSalesByProfessionalUseCase,
    ListReportSalesByTreatmentUseCase,
    ListReportExpensesByCategoryUseCase,
    ListReportExcludedRevenuesUseCase,
    ListReportReferredPatientsUseCase,
  ],
})
export class ReportsModule {}
