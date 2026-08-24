import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/get-financial-entry-attachment/get-financial-entry-attachment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('financial-entries')
@Controller('v1/financial-entries/:id/attachments/:attachmentId')
export class GetFinancialEntryAttachmentRoute {
  constructor(
    private readonly getAttachment: GetFinancialEntryAttachmentUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Baixar comprovante do lançamento' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, fileName } = await this.getAttachment.execute({
      organizationId,
      financialEntryId: id,
      attachmentId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName.replace(/"/g, '')}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
