import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { GetCommissionPaymentDetailUseCase } from '../../../application/use-cases/get-commission-payment-detail/get-commission-payment-detail.use-case';
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
import { CommissionPaymentPresenter } from './commission-payment.presenter';

class HistoryMemberDetailQueryDto {
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
@Controller('v1/commissions/history')
@RequireAnyPermission(
  { action: 'read', subject: 'FinancialCommission' },
  { action: 'update', subject: 'FinancialCommission' },
)
export class GetCommissionPaymentDetailRoute {
  constructor(
    private readonly getCommissionPaymentDetail: GetCommissionPaymentDetailUseCase,
  ) {}

  @Get(':memberId')
  @ApiOperation({
    summary:
      'Detalhe do histórico de comissões do profissional (pagamentos do período agregados)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Query() query: HistoryMemberDetailQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: AuthenticatedUser & PermissionUser,
  ) {
    const ability = buildCommissionAbility(scope, user);
    assertCanReadCommissionMember(ability, scope.memberId, memberId);
    const detail = await this.getCommissionPaymentDetail.execute({
      storeId,
      memberId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return CommissionPaymentPresenter.toDetailHttp(detail);
  }
}
