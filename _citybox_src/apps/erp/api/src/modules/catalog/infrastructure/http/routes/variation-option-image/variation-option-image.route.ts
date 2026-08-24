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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DeleteVariationOptionImageUseCase } from '../../../../application/use-cases/delete-variation-option-image/delete-variation-option-image.use-case';
import { GetVariationOptionImageUseCase } from '../../../../application/use-cases/get-variation-option-image/get-variation-option-image.use-case';
import { UploadVariationOptionImageUseCase } from '../../../../application/use-cases/upload-variation-option-image/upload-variation-option-image.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  OrganizationId,
  Tenant,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { VariationPresenter } from '../shared/variation.presenter';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('variations')
@Controller('v1/variations/:variationId/options/:optionId/image')
@RequirePermission('store.catalog.manage')
export class VariationOptionImageRoute {
  constructor(
    private readonly uploadVariationOptionImage: UploadVariationOptionImageUseCase,
    private readonly getVariationOptionImage: GetVariationOptionImageUseCase,
    private readonly deleteVariationOptionImage: DeleteVariationOptionImageUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar imagem da opção de variação' })
  async upload(
    @Tenant() tenant: TenantContext,
    @Param('variationId') variationId: string,
    @Param('optionId') optionId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const variation = await this.uploadVariationOptionImage.execute({
      organizationId: tenant.organizationId,
      variationId,
      optionId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return VariationPresenter.toHttpSingle(variation);
  }

  @Get()
  @ApiOperation({ summary: 'Obter imagem da opção de variação' })
  async download(
    @OrganizationId() organizationId: string,
    @Param('variationId') variationId: string,
    @Param('optionId') optionId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getVariationOptionImage.execute({
      organizationId,
      variationId,
      optionId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover imagem da opção de variação' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('variationId') variationId: string,
    @Param('optionId') optionId: string,
  ) {
    const variation = await this.deleteVariationOptionImage.execute({
      organizationId: tenant.organizationId,
      variationId,
      optionId,
    });
    return VariationPresenter.toHttpSingle(variation);
  }
}
