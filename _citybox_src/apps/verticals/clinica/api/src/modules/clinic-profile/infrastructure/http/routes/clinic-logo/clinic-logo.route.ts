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
import { UploadClinicLogoUseCase } from '../../../../application/use-cases/upload-clinic-logo/upload-clinic-logo.use-case';
import { GetClinicLogoUseCase } from '../../../../application/use-cases/get-clinic-logo/get-clinic-logo.use-case';
import { DeleteClinicLogoUseCase } from '../../../../application/use-cases/delete-clinic-logo/delete-clinic-logo.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toClinicProfileResponse } from '../shared/clinic-profile-response.mapper';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('clinic-profile')
@Controller('v1/clinic-profile/logo')
@RequirePermission('manage', 'Settings')
export class ClinicLogoRoute {
  constructor(
    private readonly uploadLogo: UploadClinicLogoUseCase,
    private readonly getLogo: GetClinicLogoUseCase,
    private readonly deleteLogo: DeleteClinicLogoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar logotipo da clínica' })
  async upload(
    @StoreId() storeId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const profile = await this.uploadLogo.execute({
      storeId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return { data: toClinicProfileResponse(profile) };
  }

  @Get()
  @ApiOperation({ summary: 'Obter logotipo da clínica' })
  async download(@StoreId() storeId: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.getLogo.execute({ storeId });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover logotipo da clínica' })
  async remove(@StoreId() storeId: string) {
    const profile = await this.deleteLogo.execute({ storeId });
    return { data: toClinicProfileResponse(profile) };
  }
}
