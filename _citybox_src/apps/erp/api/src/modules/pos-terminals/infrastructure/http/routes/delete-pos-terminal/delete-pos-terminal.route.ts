import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletePosTerminalUseCase } from '../../../../application/use-cases/delete-pos-terminal/delete-pos-terminal.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class DeletePosTerminalRoute {
  constructor(private readonly deletePosTerminal: DeletePosTerminalUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({ summary: 'Excluir terminal de PDV (soft-delete)' })
  @ApiResponse({ status: 204, description: 'Terminal excluído' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePosTerminal.execute({ organizationId, id });
  }
}
