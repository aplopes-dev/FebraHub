import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListDocumentTemplatesUseCase } from '../../../../application/use-cases/list-document-templates/list-document-templates.use-case';
import { mapDocumentTemplateToHttp } from '../shared/document-template-response.mapper';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class ListDocumentTemplatesRoute {
  constructor(private readonly listTemplates: ListDocumentTemplatesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Settings')
  @ApiOperation({ summary: 'Listar modelos de documentos da loja' })
  async handle(
    @StoreId() storeId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('ativo') ativo?: string,
  ) {
    const result = await this.listTemplates.execute({
      storeId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search,
      tipo,
      ativo,
    });
    return {
      data: result.items.map(mapDocumentTemplateToHttp),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
