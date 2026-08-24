import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { GetPublicListingPhotoUseCase } from '../../../../application/use-cases/get-public-listing-photo/get-public-listing-photo.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/listings')
@UseGuards(PublicCatalogRateLimitGuard)
export class GetPublicListingPhotoRoute {
  constructor(
    private readonly getPublicListingPhoto: GetPublicListingPhotoUseCase,
  ) {}

  @Get(':listingId/photos/:photoId')
  @Public()
  @ApiOperation({ summary: 'Foto pública de imóvel do catálogo' })
  async handle(
    @Param('storeId') storeId: string,
    @Param('listingId') listingId: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getPublicListingPhoto.execute({
      storeId,
      listingId,
      photoId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }
}
