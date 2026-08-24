import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetFiscalDocumentUseCase } from '../../../../application/use-cases/get-fiscal-document/get-fiscal-document.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../shared/fiscal-document.presenter';

@ApiTags('fiscal-documents')
@Controller('v1/fiscal-documents')
@RequirePermission('fiscal.documents.view')
export class GetFiscalDocumentRoute {
  constructor(private readonly getFiscalDocument: GetFiscalDocumentUseCase) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar um documento fiscal (NF-e ou NFS-e) por id',
  })
  async handle(@Param('id') id: string) {
    const document = await this.getFiscalDocument.execute({
      fiscalDocumentId: id,
    });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
