import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeletePropertyPhotoUseCase } from '../../../../application/use-cases/delete-property-photo/delete-property-photo.use-case';
import { DeletePropertyPhotoPresenter } from './delete-property-photo.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/photos')
export class DeletePropertyPhotoRoute {
  constructor(
    private readonly deletePropertyPhoto: DeletePropertyPhotoUseCase,
  ) {}

  @Delete(':photoId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Remover foto do imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @Param('photoId') photoId: string,
  ) {
    const property = await this.deletePropertyPhoto.execute({
      storeId,
      propertyId,
      photoId,
    });
    return DeletePropertyPhotoPresenter.toHttp(property);
  }
}
