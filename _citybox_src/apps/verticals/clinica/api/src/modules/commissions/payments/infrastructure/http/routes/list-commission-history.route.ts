import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCommissionHistoryUseCase } from '../../../application/use-cases/list-commission-history/list-commission-history.use-case';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentClinicScope } from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  type PermissionUser,
  RequireAnyPermission,
} from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import {
  buildCommissionAbility,
  resolveCommissionMemberFilter,
} from '../../../../../../shared/infra/http/permissions/assert-commission-permission';
import { ListCommissionHistoryQueryDto } from './commission-payment.dto';
import { CommissionPaymentPresenter } from './commission-payment.presenter';

@ApiTags('commissions')
@Controller('v1/commissions/history')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialCommission' },
  { action: 'update', subject: 'FinancialCommission' },
)
export class ListCommissionHistoryRoute {
  constructor(
    private readonly listCommissionHistory: ListCommissionHistoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de pagamentos de comissão' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListCommissionHistoryQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
  ) {
    const ability = buildCommissionAbility(scope, user);
    const memberId = resolveCommissionMemberFilter(
      ability,
      scope.memberId,
      query.memberId ?? query.professionalId,
    );
    const result = await this.listCommissionHistory.execute({
      storeId,
      page: query.page,
      perPage: query.perPage,
      startDate: query.startDate,
      endDate: query.endDate,
      memberId,
      search: ability.can('update', 'FinancialCommission')
        ? query.search
        : undefined,
    });
    return CommissionPaymentPresenter.toHistoryListHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
