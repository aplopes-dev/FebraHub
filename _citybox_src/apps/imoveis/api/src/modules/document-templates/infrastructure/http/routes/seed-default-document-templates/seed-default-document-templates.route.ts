import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SeedDefaultDocumentTemplatesUseCase } from '../../../../application/use-cases/seed-default-document-templates/seed-default-document-templates.use-case';
import { mapDocumentTemplateToHttp } from '../shared/document-template-response.mapper';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class SeedDefaultDocumentTemplatesRoute {
  constructor(
    private readonly seedDefaults: SeedDefaultDocumentTemplatesUseCase,
  ) {}

  @Post('defaults')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Criar esqueletos padrão da loja (idempotente)' })
  async handle(@StoreId() storeId: string) {
    const items = await this.seedDefaults.execute({ storeId });
    return { data: items.map(mapDocumentTemplateToHttp) };
  }
}
