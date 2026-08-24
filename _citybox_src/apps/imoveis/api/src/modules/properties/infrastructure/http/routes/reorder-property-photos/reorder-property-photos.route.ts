import { Body, Controller, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ReorderPropertyPhotosUseCase } from '../../../../application/use-cases/reorder-property-photos/reorder-property-photos.use-case';
import { ReorderPropertyPhotosDto } from './reorder-property-photos.dto';
import { ReorderPropertyPhotosPresenter } from './reorder-property-photos.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/photos')
export class ReorderPropertyPhotosRoute {
  constructor(
    private readonly reorderPropertyPhotos: ReorderPropertyPhotosUseCase,
  ) {}

  @Put('order')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Reordenar fotos do imóvel (a 1ª vira capa)' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: ReorderPropertyPhotosDto,
  ) {
    const property = await this.reorderPropertyPhotos.execute({
      storeId,
      propertyId,
      photoIds: dto.photoIds,
    });
    return ReorderPropertyPhotosPresenter.toHttp(property);
  }
}
