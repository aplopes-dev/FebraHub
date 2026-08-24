import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelNfeUseCase } from '../../../../application/use-cases/cancel-nfe/cancel-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { CancelNfeHttpDto } from './cancel-nfe.dto';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.manage')
export class CancelNfeRoute {
  constructor(private readonly cancelNfe: CancelNfeUseCase) {}

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar NF-e dentro do prazo legal (FR-004)',
  })
  async handle(@Param('id') id: string, @Body() dto: CancelNfeHttpDto) {
    const document = await this.cancelNfe.execute({
      fiscalDocumentId: id,
      justification: dto.justification,
    });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
