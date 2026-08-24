import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteBranchUseCase } from '../../../../application/use-cases/delete-branch/delete-branch.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('branches')
@Controller('v1/branches')
export class DeleteBranchRoute {
  constructor(private readonly deleteBranch: DeleteBranchUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('org.branches.manage')
  @ApiOperation({
    summary: 'Desativar unidade',
    description:
      'Soft-delete: a unidade sai das listagens, mas as notas e movimentos já emitidos continuam apontando para ela.',
  })
  @ApiResponse({ status: 204, description: 'Unidade desativada' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteBranch.execute({ organizationId, id });
  }
}
