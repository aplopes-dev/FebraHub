import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { ListPublicAgentListingsUseCase } from '../../../../application/use-cases/list-public-agent-listings/list-public-agent-listings.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import { mapPublicListingSummary } from '../shared/public-catalog.presenter';
import { parseCsvParam } from './list-public-agent-listings.query';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class ListPublicAgentListingsRoute {
  constructor(
    private readonly listPublicListings: ListPublicAgentListingsUseCase,
  ) {}

  @Get(':slug/listings')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listagem pública de imóveis do corretor' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'purpose', required: false, description: 'sale,rent' })
  @ApiQuery({ name: 'type', required: false })
  async handle(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('purpose') purpose?: string | string[],
    @Query('type') type?: string | string[],
  ) {
    const result = await this.listPublicListings.execute({
      storeId,
      slug,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      purpose: parseCsvParam(purpose),
      type: parseCsvParam(type),
    });

    return {
      data: result.items.map((item) => mapPublicListingSummary(item, storeId)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
