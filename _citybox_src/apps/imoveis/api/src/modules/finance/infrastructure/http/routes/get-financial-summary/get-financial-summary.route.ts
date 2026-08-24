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
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import {
  GetFinancialSummaryUseCase,
  type OrganizationType,
} from '../../../../application/use-cases/get-financial-summary/get-financial-summary.use-case';
import { GetFinancialSummaryPresenter } from './get-financial-summary.presenter';

const ORGANIZATION_TYPES: readonly OrganizationType[] = [
  'AGENCY',
  'SINGLE_AGENT',
];

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class GetFinancialSummaryRoute {
  constructor(
    private readonly getFinancialSummary: GetFinancialSummaryUseCase,
  ) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Finance')
  @ApiOperation({
    summary: 'KPIs financeiros por tipo de organização (escopo do corretor)',
  })
  @ApiQuery({
    name: 'organizationType',
    required: true,
    enum: ORGANIZATION_TYPES as unknown as string[],
  })
  @ApiQuery({
    name: 'actorAgentId',
    required: false,
    description: 'Só admin/dono — filtro opcional',
  })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('organizationType') organizationType?: string,
    @Query('actorAgentId') actorAgentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!ORGANIZATION_TYPES.includes(organizationType as OrganizationType)) {
      throw new BadRequestException(
        'organizationType deve ser AGENCY ou SINGLE_AGENT.',
      );
    }

    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId:
        typeof actorAgentId === 'string' ? actorAgentId : undefined,
    });

    const summary = await this.getFinancialSummary.execute({
      storeId,
      organizationType: organizationType as OrganizationType,
      actorAgentId: scopedAgentId,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
    });
    return GetFinancialSummaryPresenter.toHttp(summary);
  }
}
