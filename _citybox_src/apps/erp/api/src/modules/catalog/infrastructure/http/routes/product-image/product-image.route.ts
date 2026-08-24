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
import { DeleteProductImageUseCase } from '../../../../application/use-cases/delete-product-image/delete-product-image.use-case';
import { GetProductImageUseCase } from '../../../../application/use-cases/get-product-image/get-product-image.use-case';
import { UploadProductImageUseCase } from '../../../../application/use-cases/upload-product-image/upload-product-image.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  OrganizationId,
  Tenant,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductPresenter } from '../shared/product.presenter';
import { resolveProductStock } from '../shared/resolve-product-stock';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('products')
@Controller('v1/products/:id/image')
@RequirePermission('store.catalog.manage')
export class ProductImageRoute {
  constructor(
    private readonly uploadProductImage: UploadProductImageUseCase,
    private readonly getProductImage: GetProductImageUseCase,
    private readonly deleteProductImage: DeleteProductImageUseCase,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar imagem do produto' })
  async upload(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const product = await this.uploadProductImage.execute({
      organizationId: tenant.organizationId,
      productId: id,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    const stock = await resolveProductStock(
      this.stockMovementRepository,
      tenant.organizationId,
      product.id,
      tenant.branchId,
    );
    return ProductPresenter.toHttp(product, [], stock);
  }

  @Get()
  @ApiOperation({ summary: 'Obter imagem do produto' })
  async download(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getProductImage.execute({
      organizationId,
      productId: id,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover imagem do produto' })
  async remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    const product = await this.deleteProductImage.execute({
      organizationId: tenant.organizationId,
      productId: id,
    });
    const stock = await resolveProductStock(
      this.stockMovementRepository,
      tenant.organizationId,
      product.id,
      tenant.branchId,
    );
    return ProductPresenter.toHttp(product, [], stock);
  }
}
