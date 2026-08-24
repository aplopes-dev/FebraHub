import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssueNfeUseCase } from '../../../../application/use-cases/issue-nfe/issue-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { IssueNfeDto } from './issue-nfe.dto';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.manage')
export class IssueNfeRoute {
  constructor(private readonly issueNfe: IssueNfeUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Emitir NF-e (chamada síncrona — FR-016, resultado na resposta)',
  })
  async handle(@Body() dto: IssueNfeDto) {
    const document = await this.issueNfe.execute(dto);
    return FiscalDocumentPresenter.toHttp(document);
  }
}
