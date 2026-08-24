import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequireAnyPermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import { PreviewDocumentUseCase } from '../../../../application/use-cases/preview-document/preview-document.use-case';
import { DocumentGenerateDto } from '../shared/document-generate.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('v1/documents')
export class PreviewDocumentRoute {
  constructor(private readonly previewDocument: PreviewDocumentUseCase) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @RequireAnyPermission(
    { action: 'manage', subject: 'Lead' },
    { action: 'read', subject: 'Lead' },
    { action: 'manage', subject: 'Calendar' },
    { action: 'read', subject: 'Calendar' },
    { action: 'manage', subject: 'Transaction' },
    { action: 'read', subject: 'Transaction' },
  )
  @ApiOperation({ summary: 'Pré-visualizar merge HTML sem persistir' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: DocumentGenerateDto,
    @CurrentUser() user: PermissionUser,
  ) {
    const result = await this.previewDocument.execute({
      storeId,
      templateId: dto.templateId,
      leadId: dto.leadId,
      appointmentId: dto.appointmentId,
      transactionId: dto.transactionId,
      actorAgentId: user.sub,
    });
    return { data: result };
  }
}
