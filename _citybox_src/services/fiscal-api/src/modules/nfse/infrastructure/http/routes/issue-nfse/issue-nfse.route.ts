import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssueNfseUseCase } from '../../../../application/use-cases/issue-nfse/issue-nfse.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { IssueNfseDto } from './issue-nfse.dto';

@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.manage')
export class IssueNfseRoute {
  constructor(private readonly issueNfse: IssueNfseUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Emitir NFS-e (Padrão Nacional, piloto Ilhéus/BA — FR-016)',
  })
  async handle(@Body() dto: IssueNfseDto) {
    const document = await this.issueNfse.execute(dto);
    return FiscalDocumentPresenter.toHttp(document);
  }
}
