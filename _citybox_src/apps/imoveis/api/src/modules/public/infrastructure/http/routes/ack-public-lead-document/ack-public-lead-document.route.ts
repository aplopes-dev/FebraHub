import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { AckPublicLeadDocumentUseCase } from '../../../../../leads/application/use-cases/ack-public-lead-document/ack-public-lead-document.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';

@ApiTags('public')
@Controller('v1/public/documents')
@UseGuards(PublicCatalogRateLimitGuard)
export class AckPublicLeadDocumentRoute {
  constructor(
    private readonly ackPublicLeadDocument: AckPublicLeadDocumentUseCase,
  ) {}

  @Post(':token/ack')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marca o documento público como visualizado (uma vez)',
  })
  async handle(@Param('token') token: string) {
    const result = await this.ackPublicLeadDocument.execute({ token });
    return { data: { viewedAt: result.viewedAt.toISOString() } };
  }
}
