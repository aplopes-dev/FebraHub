import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { AuthenticatePosOperatorUseCase } from './application/use-cases/authenticate-pos-operator/authenticate-pos-operator.use-case';
import { ListTerminalOperatorsUseCase } from './application/use-cases/list-terminal-operators/list-terminal-operators.use-case';
import { SyncTerminalOperatorsUseCase } from './application/use-cases/sync-terminal-operators/sync-terminal-operators.use-case';
import { AuthenticatePosOperatorRoute } from './infrastructure/http/routes/authenticate-pos-operator/authenticate-pos-operator.route';
import { ListTerminalOperatorsRoute } from './infrastructure/http/routes/list-terminal-operators/list-terminal-operators.route';
import { ListTerminalSellersRoute } from './infrastructure/http/routes/list-terminal-sellers/list-terminal-sellers.route';
import { SyncTerminalOperatorsRoute } from './infrastructure/http/routes/sync-terminal-operators/sync-terminal-operators.route';
import { ListTerminalSellersUseCase } from './application/use-cases/list-terminal-sellers/list-terminal-sellers.use-case';

/**
 * Rotas **device** do PDV (`v1/pos/operators*`, `v1/pos/sellers`).
 *
 * Identidade = Membership (código+PIN + `pdv.operacao.*`). O CRUD JWT
 * `/v1/pos-operators` foi aposentado — credenciais no backoffice via
 * `PUT /v1/members/:id` + `PUT /v1/members/:id/pdv-pin`.
 */
@Module({
  imports: [TenancyModule, PosTerminalsModule],
  controllers: [
    SyncTerminalOperatorsRoute,
    ListTerminalOperatorsRoute,
    ListTerminalSellersRoute,
    AuthenticatePosOperatorRoute,
  ],
  providers: [
    AuthenticatePosOperatorUseCase,
    ListTerminalOperatorsUseCase,
    ListTerminalSellersUseCase,
    SyncTerminalOperatorsUseCase,
  ],
})
export class PosOperatorsModule {}
