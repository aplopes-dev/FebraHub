import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetPropertyDocumentUseCase } from '../../../../application/use-cases/get-property-document/get-property-document.use-case';

/** `filename` ASCII + `filename*` RFC 5987 para nomes com acento. */
function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/documents')
export class GetPropertyDocumentRoute {
  constructor(
    private readonly getPropertyDocument: GetPropertyDocumentUseCase,
  ) {}

  @Get(':documentId')
  @RequirePermission('read', 'Property')
  @ApiOperation({ summary: 'Obter bytes do documento do imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, name } = await this.getPropertyDocument.execute({
      storeId,
      propertyId,
      documentId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
