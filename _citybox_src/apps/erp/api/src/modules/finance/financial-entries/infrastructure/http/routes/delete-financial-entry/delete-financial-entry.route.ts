import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialEntryUseCase } from '../../../../application/use-cases/delete-financial-entry/delete-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class DeleteFinancialEntryRoute {
  constructor(
    private readonly deleteFinancialEntry: DeleteFinancialEntryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir lançamento financeiro',
    description:
      'Soft-delete: relatórios já fechados e parcelas de contrato continuam apontando para ele.',
  })
  @ApiResponse({ status: 204, description: 'Lançamento excluído' })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'Lançamento tem um pagamento com conciliação bancária ativa — desfaça a conciliação antes de excluir (spec 007-financeiro-ajustes-ui, US10)',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteFinancialEntry.execute({ organizationId, id });
  }
}
