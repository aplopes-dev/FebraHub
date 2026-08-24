import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportProductsUseCase } from '../../../../application/use-cases/import-products/import-products.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { PRODUCT_IMPORT_MAX_BYTES } from '../../../../application/utils/product-import-xlsx';

@ApiTags('products')
@Controller('v1/products/import')
@RequirePermission('store.catalog.manage')
export class ImportProductsRoute {
  constructor(private readonly importProducts: ImportProductsUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: PRODUCT_IMPORT_MAX_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar produtos via XLSX (máx. 5 MB / 500 linhas)' })
  async handle(
    @Tenant() tenant: TenantContext,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo XLSX obrigatório');
    }
    const result = await this.importProducts.execute({
      organizationId: tenant.organizationId,
      branchId: tenant.branchId,
      buffer: file.buffer,
    });
    return { data: result };
  }
}
