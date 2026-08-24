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
import { GetPublicAgentUseCase } from '../../../../application/use-cases/get-public-agent/get-public-agent.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import { mapPublicAgentToHttp } from '../shared/public-catalog.presenter';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class GetPublicAgentRoute {
  constructor(private readonly getPublicAgent: GetPublicAgentUseCase) {}

  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perfil público do corretor' })
  async handle(@Param('storeId') storeId: string, @Param('slug') slug: string) {
    const agent = await this.getPublicAgent.execute({ storeId, slug });
    return { data: mapPublicAgentToHttp(agent) };
  }
}
