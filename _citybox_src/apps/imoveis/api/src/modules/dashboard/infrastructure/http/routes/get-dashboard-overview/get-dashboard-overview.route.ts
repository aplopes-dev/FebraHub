import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { resolveScopedAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import {
  isPlatformAdmin,
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import type { OrganizationType } from '../../../../../finance/application/policies/gross-revenue.math';
import {
  GetDashboardOverviewUseCase,
  type DashboardModules,
  type DashboardPerformancePeriod,
} from '../../../../application/use-cases/get-dashboard-overview/get-dashboard-overview.use-case';
import { GetDashboardOverviewPresenter } from './get-dashboard-overview.presenter';

const ORGANIZATION_TYPES: readonly OrganizationType[] = [
  'AGENCY',
  'SINGLE_AGENT',
];

const PERIODS: readonly DashboardPerformancePeriod[] = [
  'monthly',
  'quarterly',
  'yearly',
];

function modulesFromPermissions(
  user: PermissionUser,
  scope: ImoveisScope | undefined,
): DashboardModules {
  if (isPlatformAdmin(user) || user.isOrganizationOwner === true) {
    return {
      leads: true,
      properties: true,
      transactions: true,
      finance: true,
      calendar: true,
    };
  }
  if (scope?.role === 'admin') {
    return {
      leads: true,
      properties: true,
      transactions: true,
      finance: true,
      calendar: true,
    };
  }
  const set = new Set(user.permissions ?? scope?.permissions ?? []);
  return {
    leads: set.has('leads'),
    properties: set.has('properties'),
    transactions: set.has('transactions'),
    finance: set.has('finance'),
    calendar: set.has('calendar'),
  };
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('v1/dashboard')
export class GetDashboardOverviewRoute {
  constructor(
    private readonly getDashboardOverview: GetDashboardOverviewUseCase,
  ) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Dashboard')
  @ApiOperation({
    summary:
      'Visão do dashboard (KPIs/previews do desempenho do usuário e módulos permitidos)',
  })
  @ApiQuery({
    name: 'organizationType',
    required: true,
    enum: ORGANIZATION_TYPES as unknown as string[],
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: PERIODS as unknown as string[],
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('organizationType') organizationType?: string,
    @Query('period') period?: string,
  ) {
    if (!ORGANIZATION_TYPES.includes(organizationType as OrganizationType)) {
      throw new BadRequestException(
        'organizationType deve ser AGENCY ou SINGLE_AGENT.',
      );
    }

    if (
      period !== undefined &&
      period !== '' &&
      !PERIODS.includes(period as DashboardPerformancePeriod)
    ) {
      throw new BadRequestException(
        'period deve ser monthly, quarterly ou yearly.',
      );
    }

    const scopeAgentId = resolveScopedAgentId({ user, scope });
    const modules = modulesFromPermissions(user, scope);

    const overview = await this.getDashboardOverview.execute({
      storeId,
      organizationType: organizationType as OrganizationType,
      scopeAgentId,
      actorAgentId: scopeAgentId,
      modules,
      period:
        typeof period === 'string' && period.trim()
          ? (period.trim() as DashboardPerformancePeriod)
          : undefined,
    });

    return GetDashboardOverviewPresenter.toHttp(overview);
  }
}
