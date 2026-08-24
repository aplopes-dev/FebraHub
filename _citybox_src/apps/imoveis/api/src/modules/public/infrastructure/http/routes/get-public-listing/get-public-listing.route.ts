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
import { GetPublicListingUseCase } from '../../../../application/use-cases/get-public-listing/get-public-listing.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import { mapPublicListingDetail } from '../shared/public-catalog.presenter';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/listings')
@UseGuards(PublicCatalogRateLimitGuard)
export class GetPublicListingRoute {
  constructor(private readonly getPublicListing: GetPublicListingUseCase) {}

  @Get(':listingId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Detalhe público de imóvel do catálogo (com agentSlug = catálogo do corretor; sem = link curto da loja)',
  })
  @ApiQuery({
    name: 'agentSlug',
    required: false,
    description:
      'Quando presente, só retorna se o imóvel pertencer a este corretor ativo',
  })
  async handle(
    @Param('storeId') storeId: string,
    @Param('listingId') listingId: string,
    @Query('agentSlug') agentSlug?: string,
  ) {
    const property = await this.getPublicListing.execute({
      storeId,
      listingId,
      agentSlug: agentSlug?.trim() || undefined,
    });
    return { data: mapPublicListingDetail(property, storeId) };
  }
}
