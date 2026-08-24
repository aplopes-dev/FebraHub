import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteFinancialGroupUseCase } from '../../../../application/use-cases/delete-financial-group/delete-financial-group.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class DeleteFinancialGroupRoute {
  constructor(private readonly deleteGroup: DeleteFinancialGroupUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Excluir grupo financeiro (soft-delete)' })
  @ApiResponse({ status: 204, description: 'Grupo excluído' })
  @ApiResponse({
    status: 409,
    description: 'Grupo possui contas do plano vinculadas',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteGroup.execute({ organizationId, id });
  }
}
