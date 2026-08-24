import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { ListPublicAgentsUseCase } from '../../../../application/use-cases/list-public-agents/list-public-agents.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class ListPublicAgentsRoute {
  constructor(private readonly listPublicAgents: ListPublicAgentsUseCase) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Índice público de corretores ativos' })
  async handle(@Param('storeId') storeId: string) {
    const result = await this.listPublicAgents.execute({ storeId });
    return { data: result.items };
  }
}
