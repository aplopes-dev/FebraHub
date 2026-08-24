import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetGeneratedDocumentUseCase } from '../../../../application/use-cases/get-generated-document/get-generated-document.use-case';

function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('v1/documents')
export class GetGeneratedDocumentRoute {
  constructor(
    private readonly getGeneratedDocument: GetGeneratedDocumentUseCase,
  ) {}

  @Get(':id')
  @RequireAnyPermission(
    { action: 'read', subject: 'Lead' },
    { action: 'read', subject: 'Calendar' },
    { action: 'read', subject: 'Transaction' },
    { action: 'read', subject: 'Settings' },
  )
  @ApiOperation({ summary: 'Baixar PDF gerado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, name } = await this.getGeneratedDocument.execute({
      storeId,
      id,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
