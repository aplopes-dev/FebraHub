import { Module } from '@nestjs/common';

import { FinancialGroupsModule } from '../financial-groups/financial-groups.module';

import { ChartOfAccountRepository } from './domain/repositories/chart-of-account.repository.interface';
import { PrismaChartOfAccountRepository } from './infrastructure/database/prisma-chart-of-account.repository';

import { CreateChartOfAccountUseCase } from './application/use-cases/create-chart-of-account/create-chart-of-account.use-case';
import { ListChartOfAccountsUseCase } from './application/use-cases/list-chart-of-accounts/list-chart-of-accounts.use-case';
import { FindChartOfAccountByIdUseCase } from './application/use-cases/find-chart-of-account-by-id/find-chart-of-account-by-id.use-case';
import { UpdateChartOfAccountUseCase } from './application/use-cases/update-chart-of-account/update-chart-of-account.use-case';
import { DeleteChartOfAccountUseCase } from './application/use-cases/delete-chart-of-account/delete-chart-of-account.use-case';
import { RestoreChartOfAccountUseCase } from './application/use-cases/restore-chart-of-account/restore-chart-of-account.use-case';

import { CreateChartOfAccountRoute } from './infrastructure/http/routes/create-chart-of-account/create-chart-of-account.route';
import { ListChartOfAccountsRoute } from './infrastructure/http/routes/list-chart-of-accounts/list-chart-of-accounts.route';
import { FindChartOfAccountByIdRoute } from './infrastructure/http/routes/find-chart-of-account-by-id/find-chart-of-account-by-id.route';
import { UpdateChartOfAccountRoute } from './infrastructure/http/routes/update-chart-of-account/update-chart-of-account.route';
import { DeleteChartOfAccountRoute } from './infrastructure/http/routes/delete-chart-of-account/delete-chart-of-account.route';
import { RestoreChartOfAccountRoute } from './infrastructure/http/routes/restore-chart-of-account/restore-chart-of-account.route';

/**
 * Plano de contas da organização.
 *
 * Importa a `FinancialGroupsModule` pelo `FinancialGroupRepository`: criar e
 * atualizar conferem que o grupo informado existe e não está excluído.
 */
@Module({
  imports: [FinancialGroupsModule],
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListChartOfAccountsRoute,
    CreateChartOfAccountRoute,
    RestoreChartOfAccountRoute,
    FindChartOfAccountByIdRoute,
    UpdateChartOfAccountRoute,
    DeleteChartOfAccountRoute,
  ],
  providers: [
    {
      provide: ChartOfAccountRepository,
      useClass: PrismaChartOfAccountRepository,
    },
    CreateChartOfAccountUseCase,
    ListChartOfAccountsUseCase,
    FindChartOfAccountByIdUseCase,
    UpdateChartOfAccountUseCase,
    DeleteChartOfAccountUseCase,
    RestoreChartOfAccountUseCase,
  ],
  exports: [ChartOfAccountRepository],
})
export class ChartOfAccountsModule {}
