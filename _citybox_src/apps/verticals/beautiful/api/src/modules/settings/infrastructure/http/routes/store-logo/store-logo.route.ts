import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UploadStoreLogoUseCase } from '../../../../application/use-cases/upload-store-logo/upload-store-logo.use-case';
import { GetStoreLogoUseCase } from '../../../../application/use-cases/get-store-logo/get-store-logo.use-case';
import { DeleteStoreLogoUseCase } from '../../../../application/use-cases/delete-store-logo/delete-store-logo.use-case';
import { StoreSettingsPresenter } from '../../shared/store-settings.presenter';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('settings')
@Controller('v1/settings/store/logo')
export class StoreLogoRoute {
  constructor(
    private readonly uploadLogo: UploadStoreLogoUseCase,
    private readonly getLogo: GetStoreLogoUseCase,
    private readonly deleteLogo: DeleteStoreLogoUseCase,
  ) {}

  @RequirePermission('manage', 'Settings')
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar logotipo do estabelecimento' })
  async upload(
    @StoreId() storeId: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const settings = await this.uploadLogo.execute({
      storeId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return { data: StoreSettingsPresenter.toHTTP(settings) };
  }

  @Get()
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Obter logotipo do estabelecimento' })
  async download(@StoreId() storeId: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.getLogo.execute({ storeId });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @RequirePermission('manage', 'Settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover logotipo do estabelecimento' })
  async remove(@StoreId() storeId: string) {
    const settings = await this.deleteLogo.execute({ storeId });
    return { data: StoreSettingsPresenter.toHTTP(settings) };
  }
}
