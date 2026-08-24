import { Module } from '@nestjs/common';
import { PosPoliciesModule } from '../pos-policies/pos-policies.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosCashSessionRepository } from './domain/repositories/pos-cash-session.repository.interface';
import { PrismaPosCashSessionRepository } from './infrastructure/database/prisma-pos-cash-session.repository';
import { GetCurrentCashSessionUseCase } from './application/use-cases/get-current-cash-session/get-current-cash-session.use-case';
import { OpenCashSessionUseCase } from './application/use-cases/open-cash-session/open-cash-session.use-case';
import { AddCashMovementUseCase } from './application/use-cases/add-cash-movement/add-cash-movement.use-case';
import { CloseCashSessionUseCase } from './application/use-cases/close-cash-session/close-cash-session.use-case';
import { ListCashSessionsUseCase } from './application/use-cases/list-cash-sessions/list-cash-sessions.use-case';
import { GetCashSessionByIdUseCase } from './application/use-cases/get-cash-session-by-id/get-cash-session-by-id.use-case';
import { ListSessionSalesUseCase } from './application/use-cases/list-session-sales/list-session-sales.use-case';
import { ListCurrentSessionSalesUseCase } from './application/use-cases/list-current-session-sales/list-current-session-sales.use-case';
import { GetSessionSaleUseCase } from './application/use-cases/get-session-sale/get-session-sale.use-case';
import { ListSessionMovementsUseCase } from './application/use-cases/list-session-movements/list-session-movements.use-case';
import { GetClosingReportUseCase } from './application/use-cases/get-closing-report/get-closing-report.use-case';
import { GetCurrentCashSessionRoute } from './infrastructure/http/routes/get-current-cash-session/get-current-cash-session.route';
import { ListCurrentSessionSalesRoute } from './infrastructure/http/routes/list-current-session-sales/list-current-session-sales.route';
import { OpenCashSessionRoute } from './infrastructure/http/routes/open-cash-session/open-cash-session.route';
import { AddCashMovementRoute } from './infrastructure/http/routes/add-cash-movement/add-cash-movement.route';
import { CloseCashSessionRoute } from './infrastructure/http/routes/close-cash-session/close-cash-session.route';
import { ListCashSessionsRoute } from './infrastructure/http/routes/list-cash-sessions/list-cash-sessions.route';
import { GetCashSessionByIdRoute } from './infrastructure/http/routes/get-cash-session-by-id/get-cash-session-by-id.route';
import { ListSessionSalesRoute } from './infrastructure/http/routes/list-session-sales/list-session-sales.route';
import { GetSessionSaleRoute } from './infrastructure/http/routes/get-session-sale/get-session-sale.route';
import { ListSessionMovementsRoute } from './infrastructure/http/routes/list-session-movements/list-session-movements.route';
import { GetClosingReportRoute } from './infrastructure/http/routes/get-closing-report/get-closing-report.route';

@Module({
  imports: [TenancyModule, PosTerminalsModule, PosPoliciesModule],
  controllers: [
    // Device — rotas fixas antes de :id
    GetCurrentCashSessionRoute,
    ListCurrentSessionSalesRoute,
    OpenCashSessionRoute,
    AddCashMovementRoute,
    CloseCashSessionRoute,
    // JWT — rotas aninhadas antes de :id genérico
    ListCashSessionsRoute,
    ListSessionSalesRoute,
    GetSessionSaleRoute,
    ListSessionMovementsRoute,
    GetClosingReportRoute,
    GetCashSessionByIdRoute,
  ],
  providers: [
    {
      provide: PosCashSessionRepository,
      useClass: PrismaPosCashSessionRepository,
    },
    GetCurrentCashSessionUseCase,
    ListCurrentSessionSalesUseCase,
    OpenCashSessionUseCase,
    AddCashMovementUseCase,
    CloseCashSessionUseCase,
    ListCashSessionsUseCase,
    GetCashSessionByIdUseCase,
    ListSessionSalesUseCase,
    GetSessionSaleUseCase,
    ListSessionMovementsUseCase,
    GetClosingReportUseCase,
  ],
  exports: [PosCashSessionRepository],
})
export class PosCashSessionsModule {}
