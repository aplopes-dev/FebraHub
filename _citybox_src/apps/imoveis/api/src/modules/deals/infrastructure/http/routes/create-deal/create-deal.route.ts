import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolveWritableAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { CreateDealUseCase } from '../../../../application/use-cases/create-deal/create-deal.use-case';
import { CreateDealDto } from './create-deal.dto';
import { CreateDealPresenter } from './create-deal.presenter';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class CreateDealRoute {
  constructor(private readonly createDeal: CreateDealUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Criar negócio CRM para um lead' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: CreateDealDto,
  ) {
    const agentId = resolveWritableAgentId({
      user,
      scope,
      requestedAgentId: dto.agentId,
    });
    const deal = await this.createDeal.execute({
      storeId,
      leadId: dto.leadId,
      propertyId: dto.propertyId,
      type: dto.type,
      title: dto.title,
      agentId,
    });
    return CreateDealPresenter.toHttp(deal);
  }
}
