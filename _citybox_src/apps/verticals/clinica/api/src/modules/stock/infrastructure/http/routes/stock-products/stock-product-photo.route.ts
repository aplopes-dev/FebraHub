import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { UploadStockProductPhotoUseCase } from '../../../../application/use-cases/products/upload-stock-product-photo.use-case';
import { GetStockProductPhotoUseCase } from '../../../../application/use-cases/products/get-stock-product-photo.use-case';
import { DeleteStockProductPhotoUseCase } from '../../../../application/use-cases/products/delete-stock-product-photo.use-case';

@ApiTags('stock-product-photo')
@Controller('v1/stock-products/:id/photo')
@RequirePermission('manage', 'Stock')
export class StockProductPhotoRoute {
  constructor(
    private readonly uploadPhoto: UploadStockProductPhotoUseCase,
    private readonly getPhoto: GetStockProductPhotoUseCase,
    private readonly deletePhoto: DeleteStockProductPhotoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar foto do produto' })
  async upload(
    @StoreId() storeId: string,
    @Param('id') productId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }

    await this.uploadPhoto.execute({
      storeId,
      productId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });

    return {
      data: {
        photoUrl: `/api/v1/stock-products/${productId}/photo`,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obter foto do produto' })
  async download(
    @StoreId() storeId: string,
    @Param('id') productId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getPhoto.execute({
      storeId,
      productId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover foto do produto' })
  async remove(@StoreId() storeId: string, @Param('id') productId: string) {
    await this.deletePhoto.execute({ storeId, productId });
    return { data: { photoUrl: null } };
  }
}
