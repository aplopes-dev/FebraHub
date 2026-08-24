import { Module, forwardRef } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';

import { CommissionRuleRepository } from './rules/domain/repositories/commission-rule.repository.interface';
import { PrismaCommissionRuleRepository } from './rules/infrastructure/database/prisma-commission-rule.repository';
import { GetCommissionRulesUseCase } from './rules/application/use-cases/get-commission-rules/get-commission-rules.use-case';
import { ReplaceCommissionRulesUseCase } from './rules/application/use-cases/replace-commission-rules/replace-commission-rules.use-case';
import { GetCommissionRulesRoute } from './rules/infrastructure/http/routes/get-commission-rules.route';
import { ReplaceCommissionRulesRoute } from './rules/infrastructure/http/routes/replace-commission-rules.route';

import { CommissionAccrualRepository } from './accruals/domain/repositories/commission-accrual.repository.interface';
import { PrismaCommissionAccrualRepository } from './accruals/infrastructure/database/prisma-commission-accrual.repository';
import { CreateCommissionAccrualUseCase } from './accruals/application/use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { ListOpenCommissionsUseCase } from './accruals/application/use-cases/list-open-commissions/list-open-commissions.use-case';
import { GetOpenCommissionDetailUseCase } from './accruals/application/use-cases/get-open-commission-detail/get-open-commission-detail.use-case';
import { AccrueCommissionsOnDebitReceivedService } from './accruals/application/services/accrue-commissions-on-debit-received.service';
import { AccrueCommissionsOnBudgetApprovedService } from './accruals/application/services/accrue-commissions-on-budget-approved.service';
import { AccrueCommissionsOnTreatmentCompletedService } from './accruals/application/services/accrue-commissions-on-treatment-completed.service';
import { EnrichCommissionTreatmentNamesService } from './accruals/application/services/enrich-commission-treatment-names.service';
import { CreateCommissionAccrualRoute } from './accruals/infrastructure/http/routes/create-commission-accrual.route';
import { ListOpenCommissionsRoute } from './accruals/infrastructure/http/routes/list-open-commissions.route';
import { GetOpenCommissionDetailRoute } from './accruals/infrastructure/http/routes/get-open-commission-detail.route';

import { CommissionPaymentRepository } from './payments/domain/repositories/commission-payment.repository.interface';
import { PrismaCommissionPaymentRepository } from './payments/infrastructure/database/prisma-commission-payment.repository';
import { CreateCommissionPaymentUseCase } from './payments/application/use-cases/create-commission-payment/create-commission-payment.use-case';
import { ListCommissionHistoryUseCase } from './payments/application/use-cases/list-commission-history/list-commission-history.use-case';
import { GetCommissionPaymentDetailUseCase } from './payments/application/use-cases/get-commission-payment-detail/get-commission-payment-detail.use-case';
import { CreateCommissionPaymentRoute } from './payments/infrastructure/http/routes/create-commission-payment.route';
import { ListCommissionHistoryRoute } from './payments/infrastructure/http/routes/list-commission-history.route';
import { GetCommissionPaymentDetailRoute } from './payments/infrastructure/http/routes/get-commission-payment-detail.route';

@Module({
  imports: [forwardRef(() => FinancialModule)],
  controllers: [
    GetCommissionRulesRoute,
    ReplaceCommissionRulesRoute,
    CreateCommissionAccrualRoute,
    ListOpenCommissionsRoute,
    GetOpenCommissionDetailRoute,
    CreateCommissionPaymentRoute,
    ListCommissionHistoryRoute,
    GetCommissionPaymentDetailRoute,
  ],
  providers: [
    {
      provide: CommissionRuleRepository,
      useClass: PrismaCommissionRuleRepository,
    },
    {
      provide: CommissionAccrualRepository,
      useClass: PrismaCommissionAccrualRepository,
    },
    {
      provide: CommissionPaymentRepository,
      useClass: PrismaCommissionPaymentRepository,
    },
    GetCommissionRulesUseCase,
    ReplaceCommissionRulesUseCase,
    CreateCommissionAccrualUseCase,
    ListOpenCommissionsUseCase,
    GetOpenCommissionDetailUseCase,
    AccrueCommissionsOnDebitReceivedService,
    AccrueCommissionsOnBudgetApprovedService,
    AccrueCommissionsOnTreatmentCompletedService,
    EnrichCommissionTreatmentNamesService,
    CreateCommissionPaymentUseCase,
    ListCommissionHistoryUseCase,
    GetCommissionPaymentDetailUseCase,
  ],
  exports: [
    AccrueCommissionsOnDebitReceivedService,
    AccrueCommissionsOnBudgetApprovedService,
    AccrueCommissionsOnTreatmentCompletedService,
    CommissionPaymentRepository,
  ],
})
export class CommissionsModule {}
