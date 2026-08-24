import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { PropertyNotFoundError } from '../../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../../properties/domain/repositories/property.repository.interface';
import { TeamMemberRepository } from '../../../../../settings/domain/repositories/team-member.repository.interface';
import { GetPublicListingUseCase } from '../../../../application/use-cases/get-public-listing/get-public-listing.use-case';
import { GetPublicListingPhotoUseCase } from '../../../../application/use-cases/get-public-listing-photo/get-public-listing-photo.use-case';
import { isPublicCatalogPropertyStatus } from '../../../../application/policies/public-catalog-property.policy';
import { resolvePublicAgentStoreId } from '../../../../application/policies/resolve-public-agent-store-id';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import { mapPublicListingDetail } from '../shared/public-catalog.presenter';

@ApiTags('public')
@Controller('v1/public/listings')
@UseGuards(PublicCatalogRateLimitGuard)
export class GlobalPublicListingRoute {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly properties: PropertyRepository,
    private readonly getPublicListing: GetPublicListingUseCase,
    private readonly getPublicListingPhoto: GetPublicListingPhotoUseCase,
  ) {}

  @Get(':listingId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Detalhe público de imóvel por id global (link `/p/:id` ou catálogo com agentSlug)',
  })
  @ApiQuery({ name: 'agentSlug', required: false })
  async getListing(
    @Param('listingId') listingId: string,
    @Query('agentSlug') agentSlug?: string,
  ) {
    const slug = agentSlug?.trim() || undefined;
    if (slug) {
      const storeId = await resolvePublicAgentStoreId(
        this.members,
        slug,
        GlobalPublicListingRoute.name,
      );
      const property = await this.getPublicListing.execute({
        storeId,
        listingId,
        agentSlug: slug,
      });
      return { data: mapPublicListingDetail(property, storeId) };
    }

    const property = await this.properties.findByIdGlobal(listingId);
    if (!property || !isPublicCatalogPropertyStatus(property.status)) {
      throw new PropertyNotFoundError(listingId);
    }
    return { data: mapPublicListingDetail(property, property.storeId) };
  }

  @Get(':listingId/photos/:photoId')
  @Public()
  @ApiOperation({ summary: 'Foto pública de imóvel (id global)' })
  async photo(
    @Param('listingId') listingId: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ) {
    const property = await this.properties.findByIdGlobal(listingId);
    if (!property || !isPublicCatalogPropertyStatus(property.status)) {
      throw new PropertyNotFoundError(listingId);
    }

    const { buffer, mimeType } = await this.getPublicListingPhoto.execute({
      storeId: property.storeId,
      listingId,
      photoId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }
}
