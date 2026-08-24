import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { GetPublicAgentPhotoUseCase } from '../../../../application/use-cases/get-public-agent-photo/get-public-agent-photo.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class GetPublicAgentPhotoRoute {
  constructor(
    private readonly getPublicAgentPhoto: GetPublicAgentPhotoUseCase,
  ) {}

  @Get(':slug/photo')
  @Public()
  @ApiOperation({ summary: 'Foto pública do corretor' })
  async handle(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getPublicAgentPhoto.execute({
      storeId,
      slug,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }
}
