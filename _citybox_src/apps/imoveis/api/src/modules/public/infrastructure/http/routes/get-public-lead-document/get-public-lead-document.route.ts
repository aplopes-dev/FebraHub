import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { GetPublicLeadDocumentUseCase } from '../../../../../leads/application/use-cases/get-public-lead-document/get-public-lead-document.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';

function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

@ApiTags('public')
@Controller('v1/public/documents')
@UseGuards(PublicCatalogRateLimitGuard)
export class GetPublicLeadDocumentRoute {
  constructor(
    private readonly getPublicLeadDocument: GetPublicLeadDocumentUseCase,
  ) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Download público de documento do lead (token TTL)' })
  async handle(@Param('token') token: string, @Res() res: Response) {
    const { buffer, mimeType, name } = await this.getPublicLeadDocument.execute({
      token,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }
}
