import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UploadPropertyPhotoUseCase } from '../../../../application/use-cases/upload-property-photo/upload-property-photo.use-case';
import { ImageFileValidator } from '../../../../application/validators/image-file.validator';
import { UploadPropertyPhotoPresenter } from './upload-property-photo.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/photos')
export class UploadPropertyPhotoRoute {
  constructor(
    private readonly uploadPropertyPhoto: UploadPropertyPhotoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Property')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: ImageFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar foto do imóvel (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const property = await this.uploadPropertyPhoto.execute({
      storeId,
      propertyId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return UploadPropertyPhotoPresenter.toHttp(property);
  }
}
