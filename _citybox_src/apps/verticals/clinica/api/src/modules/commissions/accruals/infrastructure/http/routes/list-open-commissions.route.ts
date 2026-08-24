import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListOpenCommissionsUseCase } from '../../../application/use-cases/list-open-commissions/list-open-commissions.use-case';
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
import { ListOpenCommissionsQueryDto } from './commission-accrual.dto';
import { CommissionAccrualPresenter } from './commission-accrual.presenter';

@ApiTags('commissions')
@Controller('v1/commissions/open')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialCommission' },
  { action: 'update', subject: 'FinancialCommission' },
)
export class ListOpenCommissionsRoute {
  constructor(
    private readonly listOpenCommissions: ListOpenCommissionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar comissões em aberto agregadas por profissional' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListOpenCommissionsQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
  ) {
    const ability = buildCommissionAbility(scope, user);
    const memberId = resolveCommissionMemberFilter(
      ability,
      scope.memberId,
      query.memberId ?? query.professionalId,
    );
    const result = await this.listOpenCommissions.execute({
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
    return CommissionAccrualPresenter.toOpenListHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
