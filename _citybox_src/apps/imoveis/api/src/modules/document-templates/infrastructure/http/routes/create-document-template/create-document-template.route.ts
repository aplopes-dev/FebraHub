import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateDocumentTemplateUseCase } from '../../../../application/use-cases/create-document-template/create-document-template.use-case';
import { DocumentTemplateWriteDto } from '../shared/document-template-write.dto';
import { mapDocumentTemplateToHttp } from '../shared/document-template-response.mapper';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class CreateDocumentTemplateRoute {
  constructor(private readonly createTemplate: CreateDocumentTemplateUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Criar modelo de documento' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: DocumentTemplateWriteDto,
  ) {
    const template = await this.createTemplate.execute({ storeId, ...dto });
    return { data: mapDocumentTemplateToHttp(template) };
  }
}
