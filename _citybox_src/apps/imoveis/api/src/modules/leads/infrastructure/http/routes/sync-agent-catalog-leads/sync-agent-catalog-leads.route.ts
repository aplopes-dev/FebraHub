import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SyncAgentCatalogLeadsUseCase } from '../../../../application/use-cases/sync-agent-catalog-leads/sync-agent-catalog-leads.use-case';
import { SyncAgentCatalogLeadsDto } from './sync-agent-catalog-leads.dto';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/agents/:agentId/leads')
export class SyncAgentCatalogLeadsRoute {
  constructor(
    private readonly syncAgentCatalog: SyncAgentCatalogLeadsUseCase,
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Sincronizar leads do catálogo do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: SyncAgentCatalogLeadsDto,
  ) {
    await this.syncAgentCatalog.execute({
      storeId,
      agentId,
      leadIds: dto.leadIds,
      fallbackAgentId: dto.fallbackAgentId,
    });
  }
}
