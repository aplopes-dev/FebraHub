import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetOpenCommissionDetailUseCase } from '../../../application/use-cases/get-open-commission-detail/get-open-commission-detail.use-case';
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
  assertCanReadCommissionMember,
  buildCommissionAbility,
} from '../../../../../../shared/infra/http/permissions/assert-commission-permission';
import { CommissionAccrualPresenter } from './commission-accrual.presenter';

class OpenCommissionDetailQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@ApiTags('commissions')
@Controller('v1/commissions/open')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialCommission' },
  { action: 'update', subject: 'FinancialCommission' },
)
export class GetOpenCommissionDetailRoute {
  constructor(
    private readonly getOpenCommissionDetail: GetOpenCommissionDetailUseCase,
  ) {}

  @Get(':memberId')
  @ApiOperation({ summary: 'Detalhe de comissões em aberto do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Query() query: OpenCommissionDetailQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
  ) {
    const ability = buildCommissionAbility(scope, user);
    assertCanReadCommissionMember(ability, scope.memberId, memberId);
    const detail = await this.getOpenCommissionDetail.execute({
      storeId,
      memberId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return CommissionAccrualPresenter.toOpenDetailHttp(detail);
  }
}
