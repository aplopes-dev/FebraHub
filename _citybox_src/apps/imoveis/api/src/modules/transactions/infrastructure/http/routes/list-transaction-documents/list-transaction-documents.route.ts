import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListTransactionDocumentsUseCase } from '../../../../application/use-cases/list-transaction-documents/list-transaction-documents.use-case';
import { ListTransactionDocumentsPresenter } from './list-transaction-documents.presenter';

/**
 * Registrado **antes** de `GetTransactionByIdRoute`: `:id/documents` não pode
 * cair no `:id` genérico.
 */
@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class ListTransactionDocumentsRoute {
  constructor(
    private readonly listTransactionDocuments: ListTransactionDocumentsUseCase,
  ) {}

  @Get(':id/documents')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Transaction')
  @ApiOperation({
    summary: 'Pacote de documentos do negócio (lead + imóvel, deduplicado)',
  })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const pack = await this.listTransactionDocuments.execute({ storeId, id });
    return ListTransactionDocumentsPresenter.toHttp(pack);
  }
}
