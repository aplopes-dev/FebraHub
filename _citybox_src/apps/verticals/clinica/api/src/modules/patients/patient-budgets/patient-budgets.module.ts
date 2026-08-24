import { Module, forwardRef } from '@nestjs/common';
import { ClinicPlansModule } from '../../clinic-plans/clinic-plans.module';
import { PatientsModule } from '../patients.module';
import { PatientTreatmentsModule } from '../patient-treatments/patient-treatments.module';
import { PatientFinancialEntriesModule } from '../patient-financial-entries/patient-financial-entries.module';
import { CommissionsModule } from '../../commissions/commissions.module';
import { SalesFunnelsModule } from '../../sales/funnels/funnels.module';
import { SalesOpportunitiesModule } from '../../sales/opportunities/opportunities.module';
import { BudgetRepository } from './domain/repositories/budget.repository.interface';
import { PrismaBudgetRepository } from './infrastructure/database/prisma-budget.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { ValidateBudgetItemReferencesService } from './application/services/validate-budget-item-references.service';
import { MaterializeBudgetTreatmentsService } from './application/services/materialize-budget-treatments.service';
import { SyncBudgetSalesOpportunityService } from './application/services/sync-budget-sales-opportunity.service';
import { CreateBudgetUseCase } from './application/use-cases/create-budget/create-budget.use-case';
import { UpdateBudgetUseCase } from './application/use-cases/update-budget/update-budget.use-case';
import { ListBudgetsUseCase } from './application/use-cases/list-budgets/list-budgets.use-case';
import { FindBudgetByIdUseCase } from './application/use-cases/find-budget-by-id/find-budget-by-id.use-case';
import { DeleteBudgetUseCase } from './application/use-cases/delete-budget/delete-budget.use-case';
import { UpdateBudgetStatusUseCase } from './application/use-cases/update-budget-status/update-budget-status.use-case';
import { CreateBudgetRoute } from './infrastructure/http/routes/create-budget/create-budget.route';
import { UpdateBudgetRoute } from './infrastructure/http/routes/update-budget/update-budget.route';
import { ListBudgetsRoute } from './infrastructure/http/routes/list-budgets/list-budgets.route';
import { FindBudgetByIdRoute } from './infrastructure/http/routes/find-budget-by-id/find-budget-by-id.route';
import { DeleteBudgetRoute } from './infrastructure/http/routes/delete-budget/delete-budget.route';
import { UpdateBudgetStatusRoute } from './infrastructure/http/routes/update-budget-status/update-budget-status.route';

@Module({
  imports: [
    ClinicPlansModule,
    PatientTreatmentsModule,
    forwardRef(() => PatientsModule),
    forwardRef(() => PatientFinancialEntriesModule),
    forwardRef(() => CommissionsModule),
    SalesFunnelsModule,
    SalesOpportunitiesModule,
  ],
  controllers: [
    CreateBudgetRoute,
    UpdateBudgetRoute,
    ListBudgetsRoute,
    FindBudgetByIdRoute,
    DeleteBudgetRoute,
    UpdateBudgetStatusRoute,
  ],
  providers: [
    { provide: BudgetRepository, useClass: PrismaBudgetRepository },
    AssertPatientExistsService,
    ValidateBudgetItemReferencesService,
    MaterializeBudgetTreatmentsService,
    SyncBudgetSalesOpportunityService,
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    ListBudgetsUseCase,
    FindBudgetByIdUseCase,
    DeleteBudgetUseCase,
    UpdateBudgetStatusUseCase,
  ],
  exports: [BudgetRepository],
})
export class PatientBudgetsModule {}
