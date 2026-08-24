import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetPropertyPhotoUseCase } from '../../../../application/use-cases/get-property-photo/get-property-photo.use-case';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/photos')
export class GetPropertyPhotoRoute {
  constructor(private readonly getPropertyPhoto: GetPropertyPhotoUseCase) {}

  @Get(':photoId')
  @RequirePermission('read', 'Property')
  @ApiOperation({ summary: 'Obter bytes da foto do imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getPropertyPhoto.execute({
      storeId,
      propertyId,
      photoId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
