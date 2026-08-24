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
import { SyncAgentCatalogPropertiesUseCase } from '../../../../application/use-cases/sync-agent-catalog-properties/sync-agent-catalog-properties.use-case';
import { SyncAgentCatalogPropertiesDto } from './sync-agent-catalog-properties.dto';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/agents/:agentId/properties')
export class SyncAgentCatalogPropertiesRoute {
  constructor(
    private readonly syncAgentCatalog: SyncAgentCatalogPropertiesUseCase,
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Sincronizar imóveis do catálogo do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: SyncAgentCatalogPropertiesDto,
  ) {
    await this.syncAgentCatalog.execute({
      storeId,
      agentId,
      propertyIds: dto.propertyIds,
      fallbackAgentId: dto.fallbackAgentId,
    });
  }
}
