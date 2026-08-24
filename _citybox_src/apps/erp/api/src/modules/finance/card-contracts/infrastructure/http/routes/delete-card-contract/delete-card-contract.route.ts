import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteCardContractUseCase } from '../../../../application/use-cases/delete-card-contract/delete-card-contract.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class DeleteCardContractRoute {
  constructor(private readonly deleteCardContract: DeleteCardContractUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir contrato de cartão',
    description:
      'Soft-delete: recebíveis já conciliados continuam apontando para ele.',
  })
  @ApiResponse({ status: 204, description: 'Contrato excluído' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteCardContract.execute({ organizationId, id });
  }
}
