import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetProductImportTemplateUseCase } from '../../../../application/use-cases/get-product-import-template/get-product-import-template.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('products')
@Controller('v1/products/import')
@RequirePermission('store.catalog.manage')
export class GetProductImportTemplateRoute {
  constructor(
    private readonly getProductImportTemplate: GetProductImportTemplateUseCase,
  ) {}

  @Get('template')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOperation({ summary: 'Baixar template XLSX de importação de produtos' })
  async handle(@Res() res: Response) {
    const buffer = await this.getProductImportTemplate.execute();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="produtos-import-template.xlsx"',
    );
    res.send(buffer);
  }
}
