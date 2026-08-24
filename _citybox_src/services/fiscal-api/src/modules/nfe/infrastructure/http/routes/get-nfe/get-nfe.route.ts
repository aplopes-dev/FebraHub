import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultNfeUseCase } from '../../../../application/use-cases/consult-nfe/consult-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.view')
export class GetNfeRoute {
  constructor(private readonly consultNfe: ConsultNfeUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consultar status de uma NF-e' })
  async handle(@Param('id') id: string) {
    const document = await this.consultNfe.execute({ fiscalDocumentId: id });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
