import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListDocumentVariablesUseCase } from '../../../../application/use-cases/list-document-variables/list-document-variables.use-case';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class ListDocumentVariablesRoute {
  constructor(private readonly listVariables: ListDocumentVariablesUseCase) {}

  @Get('variables')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Settings')
  @ApiOperation({ summary: 'Catálogo de placeholders {{tag}}' })
  async handle() {
    const result = await this.listVariables.execute();
    return { data: result };
  }
}
