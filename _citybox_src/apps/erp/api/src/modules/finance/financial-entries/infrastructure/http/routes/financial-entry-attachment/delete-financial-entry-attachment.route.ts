import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/delete-financial-entry-attachment/delete-financial-entry-attachment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('financial-entries')
@Controller('v1/financial-entries/:id/attachments/:attachmentId')
export class DeleteFinancialEntryAttachmentRoute {
  constructor(
    private readonly deleteAttachment: DeleteFinancialEntryAttachmentUseCase,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Remover comprovante do lançamento' })
  @ApiResponse({ status: 204, description: 'Anexo removido' })
  @ApiResponse({
    status: 404,
    description: 'Lançamento ou anexo não encontrado',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<void> {
    await this.deleteAttachment.execute({
      organizationId,
      financialEntryId: id,
      attachmentId,
    });
  }
}
