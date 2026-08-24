import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrectionLetterNfeUseCase } from '../../../../application/use-cases/correction-letter-nfe/correction-letter-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { CorrectionLetterNfeHttpDto } from './correction-letter-nfe.dto';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.manage')
export class CorrectionLetterNfeRoute {
  constructor(
    private readonly correctionLetterNfe: CorrectionLetterNfeUseCase,
  ) {}

  @Post(':id/correction-letter')
  @ApiOperation({
    summary: 'Emitir carta de correção para NF-e autorizada (FR-005)',
  })
  async handle(
    @Param('id') id: string,
    @Body() dto: CorrectionLetterNfeHttpDto,
  ) {
    const event = await this.correctionLetterNfe.execute({
      fiscalDocumentId: id,
      correctionText: dto.correctionText,
    });
    return FiscalDocumentPresenter.toEventHttp(event);
  }
}
