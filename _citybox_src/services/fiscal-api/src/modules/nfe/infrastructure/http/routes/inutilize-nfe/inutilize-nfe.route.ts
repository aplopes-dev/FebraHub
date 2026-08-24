import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InutilizeNfeUseCase } from '../../../../application/use-cases/inutilize-nfe/inutilize-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { InutilizeNfeHttpDto } from './inutilize-nfe.dto';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.manage')
export class InutilizeNfeRoute {
  constructor(private readonly inutilizeNfe: InutilizeNfeUseCase) {}

  @Post('inutilize')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Inutilizar faixa de numeração de NF-e não utilizada (FR-006)',
  })
  async handle(@Body() dto: InutilizeNfeHttpDto) {
    const event = await this.inutilizeNfe.execute(dto);
    return FiscalDocumentPresenter.toEventHttp(event);
  }
}
